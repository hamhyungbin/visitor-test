import { createClient } from '@supabase/supabase-js';

// Supabase 정보 (본인의 것으로 교체 필요)
const supabase = createClient(
  'https://rkkqdqqvuvdxegiyctcg.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InJra3FkcXF2dXZkeGVnaXljdGNnIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA4NDI0MDgsImV4cCI6MjA4NjQxODQwOH0.ZyAKvj3_5dTio3lq_BZO1QLA2rtJsLxokwSxZtQBnNs'
);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { fingerprint } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const userAgent = req.headers['user-agent'];

  // 핑거프린트 + IP 조합으로 더 강력한 고유 ID 생성
  const uniqueVisitorId = `${fingerprint}_${ip}`;

  try {
    // 1. 방문자 등록 시도 (이미 있으면 에러가 나거나 무시됨)
    await supabase
      .from('visitors')
      .insert([{ visitor_id: uniqueVisitorId }])
      .select(); 
      // 참고: 테이블 설정에서 visitor_id가 unique이므로 중복이면 삽입 안 됨

    // 2. 전체 고유 방문자 수 조회
    const { count, error } = await supabase
      .from('visitors')
      .select('*', { count: 'exact', head: true });

    return res.status(200).json({ totalCount: count });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }

}
