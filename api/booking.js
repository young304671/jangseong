const required=['name','phone','car','service','date','symptom'];

export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({ok:false,message:'허용되지 않는 요청입니다.'});
  let body;
  try{body=typeof req.body==='string'?JSON.parse(req.body||'{}'):req.body}catch{return res.status(400).json({ok:false,message:'입력 내용을 확인해 주세요.'})}
  if(!body||required.some(key=>typeof body[key]!=='string'||!body[key].trim())||body.agree!==true||typeof body.requestId!=='string'||!/^[-0-9a-f]{36}$/i.test(body.requestId)){
    return res.status(400).json({ok:false,message:'필수 항목과 개인정보 동의를 확인해 주세요.'});
  }
  if(Object.values(body).some(value=>typeof value==='string'&&value.length>3000))return res.status(400).json({ok:false,message:'입력 내용이 너무 깁니다.'});
  const url=process.env.BOOKING_APPS_SCRIPT_URL;
  const secret=process.env.BOOKING_WEBHOOK_SECRET;
  if(!url||!secret)return res.status(503).json({ok:false,message:'현재 온라인 접수를 준비 중입니다. 잠시 후 다시 시도해 주세요.'});
  let endpoint;
  try{endpoint=new URL(url)}catch{return res.status(503).json({ok:false,message:'현재 온라인 접수를 준비 중입니다. 잠시 후 다시 시도해 주세요.'})}
  if(endpoint.protocol!=='https:'||endpoint.hostname!=='script.google.com'||!endpoint.pathname.startsWith('/macros/s/')||!endpoint.pathname.endsWith('/exec'))return res.status(503).json({ok:false,message:'현재 온라인 접수를 준비 중입니다. 잠시 후 다시 시도해 주세요.'});
  const submission={...Object.fromEntries(['requestId',...required,'year'].map(key=>[key,String(body[key]??'').trim()])),agree:true,secret};
  try{
    const upstream=await fetch(endpoint,{method:'POST',headers:{'Content-Type':'text/plain;charset=utf-8'},body:JSON.stringify(submission),signal:AbortSignal.timeout(10000)});
    if(!upstream.ok)throw new Error('upstream response');
    const result=await upstream.json();
    if(result.ok!==true)throw new Error('upstream did not confirm storage');
    return res.status(200).json({ok:true});
  }catch{
    return res.status(502).json({ok:false,message:'접수 결과를 확인하지 못했습니다. 입력 내용을 유지했습니다. 다시 시도하기 전에 매장에 접수 여부를 확인해 주세요.'});
  }
}
