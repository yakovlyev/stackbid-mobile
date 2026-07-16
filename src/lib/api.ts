import type { AccessCheckResult, Estimate, PhotoResult, ProjectType, UserData } from './types';

// Мобильное приложение — это ещё один клиент того же бэкенда,
// что и веб (stackbid.app/server.js). Никакой логики цен/пейволла
// здесь не дублируем — только формируем те же запросы, что и index.html.
export const API_BASE = 'https://stackbid.app';

async function postJson<T>(path: string, body: unknown): Promise<T> {
  const resp = await fetch(`${API_BASE}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await resp.json();
  if (!resp.ok) {
    const err: any = new Error(data?.error || `Request failed (${resp.status})`);
    err.status = resp.status;
    err.data = data;
    throw err;
  }
  return data as T;
}

function buildEstimatePrompt(desc: string, zip: string, type: ProjectType, supplier: string) {
  return `You are a US construction materials estimator with current 2026 pricing knowledge.

Project type: ${type}
Description: ${desc || '1,200 sq ft single-story ranch, 3 bed 2 bath, slab-on-grade foundation, architectural shingle roof, vinyl siding, attached 2-car garage'}
ZIP code: ${zip}
Preferred supplier: ${supplier}

Return ONLY valid JSON, no markdown, no preamble:
{
  "title": "short project title",
  "supplier_name": "nearest wholesale supplier name for this ZIP region",
  "supplier_distance": "X.X mi",
  "categories": [
    {
      "name": "Category",
      "items": [
        {
          "name": "Material name",
          "unit": "unit",
          "qty": number,
          "retail_unit": number,
          "wholesale_unit": number,
          "local_unit": number,
          "note": "spec note"
        }
      ]
    }
  ]
}

Rules:
- retail_unit = current 2026 Home Depot / Lowe's shelf price
- wholesale_unit = 20-28% below retail
- local_unit = 5-10% below wholesale
- 4-6 relevant categories for this project type
- Use realistic current 2026 prices reflecting US construction market conditions
- Return JSON only`;
}

function parseClaudeJson(data: any): any {
  if (data?.type === 'error' || !data?.content) {
    throw new Error('api_error');
  }
  const txt = data.content.map((b: any) => b.text || '').join('');
  return JSON.parse(txt.replace(/```json|```/g, '').trim());
}

export async function generateEstimate(
  desc: string,
  zip: string,
  type: ProjectType,
  supplier: string
): Promise<Estimate> {
  const data = await postJson<any>('/api/estimate', {
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [{ role: 'user', content: buildEstimatePrompt(desc, zip, type, supplier) }],
  });
  return parseClaudeJson(data) as Estimate;
}

export async function analyzePhotoBase64(
  base64: string,
  zip: string,
  qty?: string,
  mediaType: string = 'image/jpeg'
): Promise<PhotoResult> {
  const promptText = `You are a US construction materials pricing expert. Analyze this photo carefully.
ZIP: ${zip}. Quantity needed: ${qty || 'not specified'}.

IMPORTANT: First check if this is a construction/building material (lumber, drywall, roofing, siding, concrete, flooring, insulation, hardware, pipes, tiles, etc).
If NOT a construction material (furniture, people, food, animals, cars, etc), return: {"error": "not_construction_material", "detected": "describe what you see", "message": "Please upload a photo of a construction material like lumber, drywall, roofing, or flooring."}

If it IS a construction material, return ONLY valid JSON:
{
  "identified": "exact product name as sold in US",
  "category": "material category",
  "confidence": "high/medium/low",
  "unit": "unit of measure (ea, linear ft, sq ft, bag, sheet, etc)",
  "qty_suggested": number,
  "hd_unit": number,
  "wholesale_unit": number,
  "local_unit": number,
  "supplier": "nearest wholesale supplier for this ZIP",
  "brand_detected": "brand name if visible or null",
  "spec": "key specification (size, grade, type)",
  "note": "brief buying tip for US homeowner"
}`;

  const data = await postJson<any>('/api/estimate', {
    model: 'claude-sonnet-4-6',
    max_tokens: 4000,
    messages: [
      {
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mediaType, data: base64 } },
          { type: 'text', text: promptText },
        ],
      },
    ],
  });
  return parseClaudeJson(data) as PhotoResult;
}

export async function checkAccess(email: string): Promise<AccessCheckResult> {
  try {
    return await postJson<AccessCheckResult>('/api/check-access', { email });
  } catch (e) {
    // fail-open, как и на вебе — баг проверки не должен блокировать лида
    return { access_granted: true };
  }
}

export async function saveEstimate(user: UserData, estimate: Estimate, zip: string, projectType: string) {
  try {
    await postJson('/api/save-estimate', {
      user,
      estimate: {
        title: estimate.title,
        project_type: projectType,
        zip,
        description: '',
        total_retail: null,
        total_wholesale: null,
        total_local: null,
        items: estimate.categories,
      },
    });
  } catch (e) {
    // не блокируем UX мобильного приложения из-за сбоя сохранения истории
  }
}

export async function logConsent(email: string, consentText: string): Promise<void> {
  try {
    await postJson('/api/log-consent', {
      email,
      consent_text: consentText,
      consent_version: 'mobile_paywall_v1_2026-07-16'
    });
  } catch (e) {
    // best effort — не блокирует чекаут
  }
}

export async function createPortalSession(email: string): Promise<{ url?: string; error?: string }> {
  try {
    return await postJson<{ url: string }>('/api/create-portal-session', { email });
  } catch (e: any) {
    return { error: e?.data?.error || e.message };
  }
}

export async function createCheckoutSession(email: string): Promise<{ url?: string; error?: string }> {
  try {
    return await postJson<{ url: string }>('/api/create-checkout-session', { email });
  } catch (e: any) {
    return { error: e?.data?.error || e.message };
  }
}

export interface EstimateHistoryItem {
  id: string;
  title: string;
  project_type: string;
  zip: string;
  total_retail: number | null;
  total_wholesale: number | null;
  total_local: number | null;
  created_at: string;
}

export async function getEstimateHistory(
  email: string
): Promise<{ is_pro: boolean; estimates: EstimateHistoryItem[] }> {
  try {
    return await postJson('/api/get-estimates', { email });
  } catch (e) {
    return { is_pro: false, estimates: [] };
  }
}
