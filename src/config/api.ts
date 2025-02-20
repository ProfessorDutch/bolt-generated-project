import { supabase } from '../lib/supabase';
import { migrateContent } from '../lib/contentMigration';
import type { ProcessingResult } from '../types';

export const api = {
  processMSAs: async (msas: string[]): Promise<ProcessingResult> => {
    try {
      const processed: string[] = [];
      const errors: Array<{ msa: string; error: string; rowId?: string; case_type?: string }> = [];
      
      // Get all source content from Supabase
      const { data: sourceContent, error: fetchError } = await supabase
        .from('new_legal_pages_duplicate')
        .select('*')
        .order('case_type');  // Order for consistent processing

      if (fetchError) {
        console.error('Database fetch error:', fetchError);
        throw new Error(`Database error: ${fetchError.message}`);
      }

      if (!sourceContent || sourceContent.length === 0) {
        throw new Error('No source content found in the database');
      }

      console.log('Content rows to process:', sourceContent.map(row => ({
        id: row.id,
        case_type: row.case_type,
        content_lengths: {
          section1: row.content_section_1?.length || 0,
          section2: row.content_section_2?.length || 0
        }
      })));

      for (const msa of msas) {
        console.log(`\n=== Processing MSA: ${msa} ===`);
        let successCount = 0;
        let failureCount = 0;

        for (const row of sourceContent) {
          console.log(`\nProcessing case type: ${row.case_type}`);
          console.log('Content validation:', {
            id: row.id,
            case_type: row.case_type,
            section1_valid: typeof row.content_section_1 === 'string' && row.content_section_1.length > 0,
            section2_valid: typeof row.content_section_2 === 'string' && row.content_section_2.length > 0,
            section1_length: row.content_section_1?.length,
            section2_length: row.content_section_2?.length,
            has_special_chars: {
              section1: /[^\x20-\x7E]/.test(row.content_section_1 || ''),
              section2: /[^\x20-\x7E]/.test(row.content_section_2 || '')
            }
          });

          try {
            const result = await migrateContent(msa, row);
            if (result.success) {
              successCount++;
              console.log(`✓ Successfully processed: ${row.case_type}`);
            } else {
              failureCount++;
              console.error(`✗ Failed to process: ${row.case_type}`, result.error);
              errors.push({ 
                msa, 
                error: result.error || 'Unknown error during content migration',
                rowId: row.id,
                case_type: row.case_type
              });
            }
          } catch (error) {
            failureCount++;
            console.error(`✗ Error processing case type ${row.case_type}:`, error);
            errors.push({ 
              msa, 
              error: error instanceof Error ? error.message : 'Unknown error in processing',
              rowId: row.id,
              case_type: row.case_type
            });
          }
        }

        console.log(`\n=== MSA ${msa} Processing Summary ===`);
        console.log(`Successful: ${successCount}, Failed: ${failureCount}`);
        
        if (successCount > 0 && !processed.includes(msa)) {
          processed.push(msa);
        }
      }

      // Log error patterns
      const errorPatterns = errors.reduce((acc, curr) => {
        const pattern = curr.error;
        acc[pattern] = (acc[pattern] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);

      console.log('\n=== Error Pattern Analysis ===');
      console.log(errorPatterns);

      return { processed, errors };
    } catch (error) {
      console.error('MSA processing failed:', error);
      throw new Error(
        error instanceof Error 
          ? `Failed to process MSAs: ${error.message}` 
          : 'Unknown error occurred while processing MSAs'
      );
    }
  },
};
