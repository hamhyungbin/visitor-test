import { createClient } from '@supabase/supabase-js';

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_ANON_KEY);

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');

  const { fingerprint, nickname } = req.body;
  const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
  const uniqueVisitorId = `${fingerprint}_${ip}`;

  try {
    // 1. 방문자 등록 또는 닉네임 업데이트 (upsert 사용)
    await supabase
      .from('visitors')
      .upsert(
        { visitor_id: uniqueVisitorId, nickname: nickname || '익명' },
        { onConflict: 'visitor_id' }
      );

    // 2. 전체 방문자 목록을 가져와서 내 순서 찾기
    const { data: allVisitors } = await supabase
      .from('visitors')
      .select('visitor_id, nickname')
      .order('created_at', { ascending: true });

    const myIndex = allVisitors.findIndex(v => v.visitor_id === uniqueVisitorId) + 1;
    const totalCount = allVisitors.length;

    return res.status(200).json({ 
      totalCount, 
      myOrder: myIndex,
      allVisitors: allVisitors // 목록 표시용
    });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
}
