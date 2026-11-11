const SYSTEM_INSTRUCTION = `Você é o Professor Virtual do EducaMente, um assistente educacional para alunos do ensino fundamental e médio. Responda sempre em português brasileiro, com linguagem simples, acolhedora e adequada à idade. Ajude com diferentes matérias, explique passo a passo, dê exemplos e proponha exercícios quando solicitado. Não invente fatos; quando não souber, diga que não sabe. Evite solicitar dados pessoais dos alunos.`;

exports.handler = async (event) => {
  const headers = {'Content-Type':'application/json; charset=utf-8','Cache-Control':'no-store'};
  const respond = (statusCode, payload) => ({statusCode,headers,body:JSON.stringify(payload)});
  if (event.httpMethod !== 'POST') return respond(405,{error:'Método não permitido.'});
  const key = process.env.GEMINI_API_KEY;
  if (!key) return respond(503,{error:'A chave GEMINI_API_KEY não está configurada no Netlify.'});
  let body;
  try { body = JSON.parse(event.body || '{}'); } catch { return respond(400,{error:'Mensagem inválida.'}); }
  const message = String(body.message || '').trim().slice(0,1000);
  if (!message) return respond(400,{error:'Digite uma pergunta.'});
  const history = Array.isArray(body.history) ? body.history.slice(-8) : [];
  const contents = history.filter(m => m && ['user','model'].includes(m.role) && typeof m.text === 'string' && m.text.trim()).map(m => ({role:m.role,parts:[{text:m.text.slice(0,1500)}]}));
  contents.push({role:'user',parts:[{text:message}]});
  const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 23000);
    let response;
    try {
      response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,{
        method:'POST',signal:controller.signal,
        headers:{'Content-Type':'application/json','x-goog-api-key':key},
        body:JSON.stringify({systemInstruction:{parts:[{text:SYSTEM_INSTRUCTION}]},contents,generationConfig:{maxOutputTokens:700,temperature:0.6}})
      });
    } finally {clearTimeout(timer);}
    const data = await response.json().catch(() => ({}));
    if (!response.ok) {
      console.error('Gemini API:',response.status,JSON.stringify(data).slice(0,500));
      const error = response.status===429?'Limite de uso da IA atingido. Tente novamente mais tarde.':response.status===400?'Não foi possível processar a pergunta. Confira a configuração do modelo.':response.status===403?'A chave do Gemini não tem permissão para acessar esse modelo.':'Serviço de IA indisponível no momento.';
      return respond(response.status===429?429:502,{error});
    }
    const reply = (data.candidates?.[0]?.content?.parts || []).map(p=>p.text||'').join('').trim();
    if (!reply) return respond(502,{error:'A IA não retornou uma resposta. Tente reformular a pergunta.'});
    return respond(200,{reply});
  } catch (err) {
    console.error('Professor function:',err);
    return respond(502,{error:'Não foi possível conectar à IA agora. Tente novamente.'});
  }
};
