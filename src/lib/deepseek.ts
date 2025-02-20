import { DEEPSEEK_API_KEY } from '../config/env';
import type { MSAConfig } from '../config/msaConfig';

interface RewriteResponse {
  content1: string;
  content2: string;
}

interface RewriteRequest {
  msa: MSAConfig;
  case_type: string;
  content_section_1: string;
  content_section_2: string;
}

// Log DeepSeek key presence at module level
console.log('DeepSeek API Key present:', !!DEEPSEEK_API_KEY);

export async function rewriteContent({
  msa,
  case_type,
  content_section_1,
  content_section_2
}: RewriteRequest): Promise<RewriteResponse> {
  if (!DEEPSEEK_API_KEY) {
    console.error('DeepSeek API key is missing');
    return { content1: content_section_1, content2: content_section_2 };
  }

  try {
    console.log(`Processing case type: ${case_type}`);
    
    const response = await fetch('https://api.deepseek.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
      },
      body: JSON.stringify({
        model: 'deepseek-chat',
        messages: [
          {
            role: 'system',
            content: 'You are a content writer for LegalFeeFinder, a lead generation website that connects users with attorneys offering payment plans.'
          },
          {
            role: 'user',
            content: `Rewrite these two content sections for ${case_type} in ${msa.city} to include local laws, courthouses, and locale - keeping the content right at 600 characters.

Content Section 1:
${content_section_1}

Content Section 2:
${content_section_2}

Local Details:
- City: ${msa.city}
- County: ${msa.counties[0]}
- Courts: ${msa.counties[0]} County Criminal Court
- Area: ${msa.msa_region}
- Nearby cities: ${msa.surroundingCities.join(', ')}
- Courthouse: ${msa.address.street}, ${msa.city}, ${msa.state} ${msa.address.zipCode}

Requirements:
1. Maintain the original tone and structure
2. Include local courthouse and jurisdiction details
3. Mention the specific county courts and legal system
4. Reference the surrounding cities when discussing service area
5. Focus on how LegalFeeFinder helps users find attorneys offering payment plans
6. Each section must be exactly 600 characters

Return the rewritten content in this exact format:
{
  "content1": "your rewritten section 1 content here",
  "content2": "your rewritten section 2 content here"
}`
          }
        ],
        temperature: 0.7,
        max_tokens: 2000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('DeepSeek API error response:', errorText);
      throw new Error(`DeepSeek API error: ${response.status} - ${errorText}`);
    }

    const rawResponseText = await response.text();
    console.log('Raw DeepSeek response for', case_type, ':', rawResponseText);

    if (!rawResponseText) {
      throw new Error('Empty response from DeepSeek API');
    }

    let data;
    try {
      data = JSON.parse(rawResponseText);
    } catch (parseError) {
      console.error('Failed to parse DeepSeek response:', {
        case_type,
        error: parseError,
        rawResponse: rawResponseText
      });
      throw parseError;
    }

    if (!data.choices?.[0]?.message?.content) {
      console.error('Invalid API response structure:', data);
      throw new Error('Invalid API response structure');
    }

    const content = data.choices[0].message.content;
    console.log('Content from API:', content);

    let parsedContent;
    try {
      parsedContent = JSON.parse(content);
      console.log('Parsed content:', parsedContent);
    } catch (parseError) {
      console.error('JSON parsing error:', parseError);
      console.error('Failed to parse content:', content);
      throw new Error(`Failed to parse response content: ${parseError.message}`);
    }

    if (!parsedContent.content1 || !parsedContent.content2) {
      console.error('Missing content sections in parsed response:', parsedContent);
      throw new Error('Missing content sections in response');
    }

    return {
      content1: parsedContent.content1.trim(),
      content2: parsedContent.content2.trim()
    };
  } catch (error) {
    console.error(`Content rewriting failed for ${case_type}:`, error);
    return {
      content1: content_section_1,
      content2: content_section_2
    };
  }
}
