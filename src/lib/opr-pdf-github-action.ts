import type { OprData } from '@/lib/opr-html-template'

interface OprPdfJobPayload {
  version: 1
  generatedAt: string
  data: OprData
}

export async function generateOprPdfGithubActionJob(data: OprData): Promise<Blob> {
  const payload: OprPdfJobPayload = {
    version: 1,
    generatedAt: new Date().toISOString(),
    data,
  }

  return new Blob([JSON.stringify(payload, null, 2)], {
    type: 'application/json;charset=utf-8',
  })
}
