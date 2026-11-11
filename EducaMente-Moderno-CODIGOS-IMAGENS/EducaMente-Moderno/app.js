'use strict';
const ACCOUNTS_KEY = 'educamente-contas-v3';
const QUESTIONS_KEY = 'educamente-questoes-compartilhadas-v3';
const SESSION_KEY = 'educamente-sessao-v3';
const profileKey = id => `educamente-perfil-v3-${id}`;
const rosterKey = id => `educamente-turma-v3-${id}`;
const $ = selector => document.querySelector(selector);
const clean = value => String(value ?? '').trim();
const esc = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const loadJSON = (key, fallback) => { try { const raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch { return fallback; } };
const storeJSON = (key, data) => { try { localStorage.setItem(key, JSON.stringify(data)); return true; } catch { notify('Espaço local cheio. Remova fotos grandes ou dados antigos.'); return false; } };
const uuid = () => (globalThis.crypto?.randomUUID?.() || `${Date.now()}-${Math.random().toString(36).slice(2)}`);
const normalize = value => clean(value).normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
const currentDate = () => new Date().toLocaleDateString('pt-BR');
const IMG = 'imagens/';

const SUBJECTS = {
  ler:{name:'Aprender a Ler',icon:'📖',image:'menina-leitura.png',label:'LEITURA E ALFABETIZAÇÃO',subtitle:'Descubra as letras, sílabas e palavras de um jeito divertido.'},
  escrever:{name:'Aprender a Escrever',icon:'✏️',image:'lapis-escrita.png',label:'ESCRITA CRIATIVA',subtitle:'Treine palavras, ortografia e a construção de frases.'},
  matematica:{name:'Matemática',icon:'🧮',image:'calculadora.png',label:'MUNDO DOS NÚMEROS',subtitle:'Faça cálculos e conquiste estrelas em cada desafio.'}
};
const BUILTIN = [
  {id:'l01',subject:'ler',title:'Reconhecendo vogais',question:'Qual destas letras é uma vogal?',options:['B','E','T'],answer:1,explain:'As vogais são A, E, I, O e U.'},
  {id:'l02',subject:'ler',title:'Começando a ler',question:'Qual palavra começa com a letra B?',options:['Casa','Bola','Dado'],answer:1,explain:'A palavra BOLA começa com B.'},
  {id:'l03',subject:'ler',title:'Formando sílabas',question:'Qual sílaba completa CA + ___ para formar CASA?',options:['SA','BO','ME'],answer:0,explain:'CA + SA = CASA.'},
  {id:'l04',subject:'ler',title:'Separando sílabas',question:'Como separamos a palavra BONECA?',options:['BO-NE-CA','BON-EC-A','B-O-NECA'],answer:0,explain:'BONECA possui três sílabas: BO-NE-CA.'},
  {id:'e01',subject:'escrever',title:'Complete a palavra',question:'Complete: C _ S A',options:['O','A','I'],answer:1,explain:'A vogal A forma a palavra CASA.'},
  {id:'e02',subject:'escrever',title:'Ortografia divertida',question:'Qual palavra está escrita corretamente?',options:['Chuva','Xuva','Chuvaa'],answer:0,explain:'CHUVA é a grafia correta.'},
  {id:'e03',subject:'escrever',title:'Construindo frases',question:'Qual opção é uma frase completa?',options:['O menino brinca.','Brinca menino o','O menino'],answer:0,explain:'A frase "O menino brinca." apresenta uma ideia completa.'},
  {id:'e04',subject:'escrever',title:'Pontuação',question:'Qual sinal usamos ao final de uma pergunta?',options:['Ponto final (.)','Ponto de interrogação (?)','Vírgula (,)'],answer:1,explain:'O ponto de interrogação (?) aparece no final de perguntas diretas.'},
  {id:'m01',subject:'matematica',title:'Adição',question:'Quanto é 7 + 5?',options:['11','13','12'],answer:2,explain:'Somando 7 e 5 encontramos 12.'},
  {id:'m02',subject:'matematica',title:'Subtração',question:'Quanto é 15 − 6?',options:['9','8','10'],answer:0,explain:'15 − 6 = 9.'},
  {id:'m03',subject:'matematica',title:'Multiplicação',question:'Quanto é 4 × 3?',options:['7','12','14'],answer:1,explain:'4 grupos de 3 objetos resultam em 12.'},
  {id:'m04',subject:'matematica',title:'Divisão',question:'Quanto é 20 ÷ 5?',options:['5','3','4'],answer:2,explain:'Dividindo 20 em 5 partes iguais, cada parte fica com 4.'},
  {id:'m05',subject:'matematica',title:'Problema matemático',question:'Ana tem 8 figurinhas e ganha mais 6. Quantas ela tem agora?',options:['14','12','16'],answer:0,explain:'8 + 6 = 14 figurinhas.'}
];
const STORIES = [
  {id:'s01',title:'A estrela curiosa',icon:'🌟',text:'Era uma vez uma estrelinha que queria conhecer a Terra. Todas as noites, ela iluminava o caminho dos viajantes. Um dia, percebeu que sua luz ajudava uma menina a encontrar o caminho de casa. A estrela descobriu que pequenos gestos podem fazer uma grande diferença.',question:'O que a estrela aprendeu?',options:['Que precisava se esconder','Que sua luz podia ajudar','Que a Terra não existia'],answer:1,explain:'Sua luz ajudou a menina, e a estrela percebeu como pequenas ações são importantes.'},
  {id:'s02',title:'O coelho e a semente',icon:'🐰',text:'Um coelhinho encontrou uma semente no jardim. Em vez de comê-la, plantou-a e regou todos os dias. Depois de algumas semanas, uma linda flor nasceu. O coelho ficou feliz ao perceber que a paciência e o cuidado trazem bons resultados.',question:'Por que a flor cresceu?',options:['Pelo cuidado e pela água','Porque ficou no escuro','Porque o coelho a escondeu'],answer:0,explain:'A semente precisou de água e cuidado para crescer.'},
  {id:'s03',title:'O barco de papel',icon:'⛵',text:'Lia fez um pequeno barco de papel e colocou-o no riacho perto de casa. O barco seguiu lentamente pela água. Quando ficou preso em uma folha, Lia usou um galhinho para libertá-lo. Ela aprendeu que, com calma e criatividade, podemos superar obstáculos.',question:'O que Lia usou para soltar o barco?',options:['Um chapéu','Uma pedra','Um galhinho'],answer:2,explain:'Lia usou um galhinho para libertar o barco de papel.'}
];
const NAV = [
  ['inicio','🏠','Início'],['aprender','🚀','Começar a aprender'],['ler','📖','Aprender a ler'],['escrever','✏️','Aprender a escrever'],['matematica','🧮','Matemática'],['clube','📚','Clube da Leitura'],['conquistas','🏆','Minhas Conquistas'],['tutor','🤖','Professor Virtual'],['area-professor','🎓','Área do Professor'],['perfil','👤','Meu Perfil']
];
let accounts = loadJSON(ACCOUNTS_KEY, []);
let me = null;
let progress = null;
let route = 'inicio';
let authMode = 'login';
let activeQuiz = null;
let activeStory = null;
let selectedAnswer = null;
let tutorTaskAnswers = {};
let searchTerm = '';
let toastTimeout = null;

function newProgress(person){return {name:person.name,role:person.role,username:person.username,points:0,completed:[],history:[],className:'Turma A',avatar:null,chat:[],tutorTasks:[]};}
function saveProgress(){if(me && progress)storeJSON(profileKey(me.username),progress);}
function questions(){return [...BUILTIN,...loadJSON(QUESTIONS_KEY,[])];}
function questionById(id){return questions().find(q=>q.id===id);}
function completed(id){return progress.completed.includes(id);}
function completionRatio(){const total=questions().length+STORIES.length;return Math.min(100,Math.round(progress.completed.length/Math.max(1,total)*100));}
function notify(text){const el=$('#toast');if(!el)return;el.textContent=text;el.classList.add('show');clearTimeout(toastTimeout);toastTimeout=setTimeout(()=>el.classList.remove('show'),3000);}
function markDone(id,title,subject,points=15){if(completed(id))return false;progress.completed.push(id);progress.points+=points;progress.history.unshift({id,title,subject,points,date:currentDate()});progress.history=progress.history.slice(0,70);saveProgress();return true;}
function renderShell(){
  $('#mainNavigation').innerHTML=NAV.filter(([id])=>id!=='area-professor'||me.role==='professor').map(([id,icon,title])=>`<button type="button" class="nav-button ${route===id?'active':''}" data-go="${id}"><span class="nav-emoji" aria-hidden="true">${icon}</span>${title}</button>`).join('');
  $('#pointsPill').textContent=`★ ${progress.points} pontos`;
  $('#topAvatar').innerHTML=progress.avatar?`<img src="${esc(progress.avatar)}" alt="Foto do perfil">`:esc(progress.name.slice(0,1).toUpperCase());
}
function switchPage(next){
  if(next==='area-professor' && me.role!=='professor'){notify('Esta área é exclusiva para perfis de professor.');return;}
  route=next;activeQuiz=null;activeStory=null;selectedAnswer=null;
  $('#sidebar').classList.remove('open');$('#scrim').hidden=true;
  render();window.scrollTo({top:0,behavior:'smooth'});
}
function banner(label,title,subtitle,image=''){return `<header class="page-top"><div><span class="page-label">${label}</span><h1>${title}</h1><p>${subtitle}</p></div>${image?`<img class="page-hero-image" src="${IMG+image}" alt="Ilustração educativa">`:''}</header>`;}
function cards(){return [
  ['ler','Aprender a Ler','Letras e sílabas','card-reading','menina-leitura.png'],
  ['escrever','Aprender a Escrever','Palavras e frases','card-writing','lapis-escrita.png'],
  ['matematica','Matemática','Números e contas','card-math','calculadora.png'],
  ['clube','Clube da Leitura','Histórias incríveis','card-library','livros.png'],
  ['conquistas','Minhas Conquistas','Suas medalhas','card-achievements','trofeu.png'],
  ['tutor','Professor Virtual','Pergunte e aprenda','card-tutor','professor-mini.png']
].map(([id,title,subtitle,cls,img])=>`<button type="button" class="learning-card ${cls}" data-go="${id}" aria-label="Abrir ${title}"><img src="${IMG+img}" alt="" aria-hidden="true"><strong>${title}</strong><small>${subtitle}</small><span class="play-circle" aria-hidden="true">▶</span></button>`).join('');}
function badges(){return [
  {name:'Primeira Estrela',icon:'⭐',description:'Conclua uma atividade',unlocked:progress.completed.length>=1},
  {name:'Leitor Destaque',icon:'📚',description:'Termine uma história',unlocked:STORIES.some(s=>completed(s.id))},
  {name:'Mestre dos Números',icon:'🧮',description:'Acerte três desafios de matemática',unlocked:BUILTIN.filter(q=>q.subject==='matematica' && completed(q.id)).length>=3},
  {name:'Escrita Criativa',icon:'📝',description:'Conclua duas atividades de escrita',unlocked:BUILTIN.filter(q=>q.subject==='escrever'&&completed(q.id)).length>=2},
  {name:'Explorador',icon:'🚀',description:'Complete cinco atividades',unlocked:progress.completed.length>=5},
  {name:'Superaluno',icon:'🏆',description:'Conquiste 100 pontos',unlocked:progress.points>=100}
];}
function profileImage(){return progress.avatar?esc(progress.avatar):IMG+'avatar-estudante.png';}
function dashboard(){const b=badges();const pct=completionRatio();return `
  <div class="dashboard-grid"><div class="dashboard-center">
    <section class="hero"><div class="hero-copy"><span class="hero-mini">✦ UM DIA CHEIO DE DESCOBERTAS</span><h1>Olá, <em>${esc(progress.name.split(' ')[0])}!</em> 👋</h1><p>Bem-vindo(a) ao EducaMente! Preparado(a) para aprender brincando?</p><button class="glow-button" data-go="aprender">Começar agora →</button></div><img src="${IMG}professor-robot.png" class="hero-robot" alt="Professor virtual robô lendo um livro"></section>
    <div class="section-row"><h2>O que vamos aprender hoje? ✨</h2><button class="sub-link" data-go="aprender">Ver todas →</button></div>
    <div class="learning-grid">${cards()}</div>
    <section class="daily-panel"><h2>📅 Atividades do Dia</h2>${[
      ['l01','📖','Reconheça as vogais','Língua Portuguesa'],['m01','🧮','Resolva o desafio de adição','Matemática']
    ].map(([id,icon,title,subject])=>`<div class="daily-item"><div class="daily-icon">${icon}</div><div class="daily-desc"><strong>${title}</strong><span>${subject}</span></div><button class="daily-btn ${completed(id)?'done':''}" data-quiz="${id}">${completed(id)?'✓ Concluído':'▶ Começar'}</button></div>`).join('')}</section>
  </div><aside class="dashboard-aside">
    <section class="side-widget user-widget"><img src="${profileImage()}" alt="Avatar do aluno"><div><strong>${esc(progress.name)}</strong><span class="tag">${me.role==='professor'?'Professor(a)':esc(progress.className)}</span><br><button type="button" class="sub-link" data-go="perfil">Editar perfil ✎</button></div></section>
    <section class="side-widget"><h3>📊 Meu Progresso</h3><div class="progress-wrap"><div class="ring" style="--p:${pct}"><strong>${pct}%</strong></div><p>Você concluiu <strong>${progress.completed.length}</strong> atividades! Continue assim.</p></div></section>
    <section class="side-widget"><h3>🏆 Últimas Conquistas</h3><div class="achieve-set">${b.slice(0,3).map(item=>`<div><div class="achievement-token" style="${item.unlocked?'':'opacity:.4;filter:grayscale(1)'}">${item.icon}</div><p class="achieve-caption">${item.name}</p></div>`).join('')}</div><button class="widget-action" data-go="conquistas">Ver todas →</button></section>
  </aside></div>`;}
function learning(){return banner('ESCOLHA SEU CAMINHO','Começar a Aprender 🚀','Escolha uma disciplina e complete desafios para ganhar estrelas!','professor-robot.png')+`<div class="section-row"><h2>Áreas de aprendizagem</h2></div><div class="learning-grid">${cards()}</div><section class="panel" style="margin-top:18px"><h2>✨ Seu próximo desafio</h2><p>Você já concluiu ${progress.completed.length} atividades. Continue aprendendo no seu ritmo!</p><button class="primary-button" data-quiz="${questions().find(q=>!completed(q.id))?.id||'l01'}">Resolver atividade →</button></section>`;}
function subjectPage(subject){const data=SUBJECTS[subject];const list=questions().filter(q=>q.subject===subject);return banner(data.label,data.name,data.subtitle,data.image)+`<div class="section-row"><h2>Atividades disponíveis (${list.length})</h2></div><div class="content-grid">${list.map((q,i)=>`<button type="button" class="topic-card ${completed(q.id)?'completed':''}" data-quiz="${esc(q.id)}"><span class="topic-icon">${data.icon}</span><h3>${esc(q.title)}</h3><p>Atividade ${i+1} • Aprenda e conquiste pontos respondendo a uma questão.</p><span class="topic-cta">${completed(q.id)?'✓ Concluída • Refazer':'▶ Resolver • +15 pontos'}</span></button>`).join('')||'<p>Nenhuma atividade cadastrada.</p>'}</div>`;}
function quizPage(){const q=questionById(activeQuiz);if(!q){activeQuiz=null;return learning();}const chosen=selectedAnswer!==null;const ok=chosen&&selectedAnswer===q.answer;const isDone=completed(q.id);return banner('DESAFIO INTERATIVO',esc(q.title),'Leia com atenção, escolha uma resposta e confira a explicação.',SUBJECTS[q.subject]?.image||'calculadora.png')+`<div class="panel" style="max-width:850px;margin:auto"><span class="mini-label">${esc(SUBJECTS[q.subject]?.name||'Atividade do professor')} • ${isDone?'Já concluída':'Vale 15 pontos'}</span><h2 class="question-title" style="margin-top:13px">${esc(q.question)}</h2><div class="answers">${q.options.map((option,i)=>`<button type="button" class="answer-button ${chosen?(i===q.answer?'correct':i===selectedAnswer?'wrong':''):''}" ${chosen?'disabled':''} data-answer="${i}"><span class="answer-letter">${'ABC'[i]}</span><span>${esc(option)}</span></button>`).join('')}</div>${chosen?`<div class="feedback ${ok?'ok':'no'}"><strong>${ok?'🎉 Parabéns! Você acertou!':'💡 Vamos aprender com essa tentativa!'}</strong><br>${esc(q.explain)}${ok?'<br>Continue praticando para conquistar novas medalhas.':''}</div><div class="buttons-row"><button class="primary-button" data-retry="true">Refazer atividade</button><button class="ghost-button" data-go="${q.subject}">Voltar às atividades</button></div>`:`<p class="section-note">Escolha uma alternativa para receber correção imediata.</p><button class="ghost-button" data-go="${q.subject}">← Voltar</button>`}</div>`;}
function library(){return banner('HISTÓRIAS E IMAGINAÇÃO','Clube da Leitura 📚','Escolha uma história, leia com atenção e responda à pergunta no final.','livros.png')+`<div class="content-grid">${STORIES.map((story,i)=>`<button type="button" class="topic-card ${completed(story.id)?'completed':''}" data-story="${story.id}"><span class="topic-icon">${story.icon}</span><h3>${story.title}</h3><p>História ${i+1} • Leia, imagine e interprete.</p><span class="topic-cta">${completed(story.id)?'✓ Já lida • Ler novamente':'▶ Começar leitura'}</span></button>`).join('')}</div>`;}
function storyPage(){const st=STORIES.find(s=>s.id===activeStory);if(!st){activeStory=null;return library();}const chosen=selectedAnswer!==null;const ok=chosen && selectedAnswer===st.answer;return banner('HORA DA HISTÓRIA',`${st.icon} ${st.title}`,'Leia a história abaixo para responder à questão.','livros.png')+`<div class="book-layout"><div class="panel"><h2>📖 Vamos ler!</h2><div class="book-pages"><p>${esc(st.text)}</p></div><h3 style="margin-top:24px">${esc(st.question)}</h3><div class="answers">${st.options.map((option,i)=>`<button class="answer-button ${chosen?(i===st.answer?'correct':i===selectedAnswer?'wrong':''):''}" data-story-answer="${i}" ${chosen?'disabled':''}><span class="answer-letter">${'ABC'[i]}</span>${esc(option)}</button>`).join('')}</div>${chosen?`<div class="feedback ${ok?'ok':'no'}">${ok?'🎉 Muito bem! História concluída.':'💡 Vamos tentar outra vez!'}<br>${esc(st.explain)}</div><div class="buttons-row"><button class="primary-button" data-retry-story="true">Ler e responder novamente</button><button class="ghost-button" data-go="clube">Outras histórias</button></div>`:''}</div><div class="panel"><h3>💜 Dicas de leitura</h3><p>Leia devagar e imagine as cenas. Se não entender uma palavra, releia a frase.</p><button type="button" class="ghost-button" data-speak-story="${st.id}">🔊 Ouvir a história</button><p class="small muted" style="margin-top:18px">A leitura em voz alta depende da disponibilidade de voz no navegador.</p></div></div>`;}
function achievements(){const all=badges();return banner('CADA PASSO IMPORTA','Minhas Conquistas 🏆','Ganhe estrelas, desbloqueie medalhas e acompanhe sua evolução.','trofeu.png')+`<div class="stat-grid"><div class="stat-box"><strong>${progress.points}</strong><small>Pontos</small></div><div class="stat-box"><strong>${progress.completed.length}</strong><small>Atividades concluídas</small></div><div class="stat-box"><strong>${Math.floor(progress.points/100)+1}</strong><small>Nível</small></div></div><h2 class="page-section-title">Suas medalhas</h2><div class="badge-grid">${all.map(item=>`<div class="badge-card ${item.unlocked?'':'locked'}"><div class="badge-art">${item.icon}</div><h3>${item.name}${item.unlocked?' ✓':''}</h3><p>${item.description}</p></div>`).join('')}</div>`;}
function speak(text){if(!('speechSynthesis' in window)){notify('Este navegador não oferece leitura em voz alta.');return;}window.speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang='pt-BR';utter.rate=.9;window.speechSynthesis.speak(utter);}
function tutorPage(){const chat=progress.chat.length?progress.chat:[{who:'bot',text:`Olá, ${progress.name}! Sou o Professor Virtual do EducaMente 🤖. Posso ensinar leitura, escrita, matemática, contar histórias e criar exercícios. O que você quer estudar?`}];return banner('SEU AMIGO DE ESTUDOS','Professor Virtual 🤖','Converse com uma inteligência artificial para aprender e tirar dúvidas.','professor-robot.png')+`<div class="chat-layout"><section class="panel"><h2>💬 Conversar com o professor</h2><div class="chat-box" id="chatBox" aria-live="polite">${chat.map((m,i)=>`<div class="chat-msg ${m.who==='user'?'user':'bot'}">${esc(m.text)}${m.who==='bot'?`<button type="button" class="chat-speaker" data-speak="${progress.chat.length?i:-1}">🔊 Ouvir</button>`:''}</div>`).join('')}</div><form id="chatForm" class="chat-form"><input id="chatInput" autocomplete="off" maxlength="300" placeholder="Ex.: Me passe 3 contas de multiplicação" aria-label="Mensagem para o professor" required><button type="submit" class="primary-button">Enviar →</button></form><p class="section-note" style="margin:10px 0 0">Professor conectado à IA online. As respostas podem conter erros; confira informações importantes.</p></section><aside><div class="panel"><h3>✨ Pergunte ao professor</h3>${['Me passe 3 contas de multiplicação','O que são sílabas?','Como funciona a divisão?','Quanto é 18 + 7?','Quero aprender a escrever'].map(message=>`<button type="button" class="suggestion" data-suggest="${esc(message)}">${esc(message)}</button>`).join('')}<button type="button" class="ghost-button" id="clearChat">Limpar conversa</button></div></aside></div>${tutorTasksView()}`;}
function tutorTasksView(){if(!progress.tutorTasks.length)return '';return `<section class="panel" style="margin-top:20px"><h2>📝 Exercícios que o professor preparou</h2><p>Responda abaixo. As questões são geradas automaticamente e corrigidas na hora.</p><div class="content-grid">${progress.tutorTasks.map((q,i)=>{const chosen=tutorTaskAnswers[q.id];return `<div class="tutor-task"><span class="mini-label">EXERCÍCIO ${i+1}</span><strong>${esc(q.question)}</strong>${q.options.map((option,index)=>`<button type="button" ${chosen!==undefined?'disabled':''} data-tutor-id="${q.id}" data-tutor-answer="${index}" class="${chosen!==undefined?(index===q.answer?'correct':chosen===index?'wrong':''):''}">${'ABC'[index]}) ${esc(option)}</button>`).join('')}${chosen!==undefined?`<small>${chosen===q.answer?'✅ Correto!':'💡 Resposta correta: '+esc(q.options[q.answer])} ${esc(q.explain)}</small>`:''}</div>`;}).join('')}</div><button class="ghost-button" id="newTutorTasks" style="margin-top:15px">Limpar exercícios</button></section>`;}
function tutorReply(raw){const t=normalize(raw);const nums=(t.match(/\d+(?:[.,]\d+)?/g)||[]).map(v=>Number(v.replace(',','.')));
  if(/exercic|quest|desafio|contas|atividad/.test(t)){
    const count=Math.min(5,Math.max(1,Number(t.match(/\b[1-5]\b/)?.[0]||3)));
    const kind=/divi/.test(t)?'divisao':/multip|tabuada|vezes/.test(t)?'multiplicacao':/subtra|menos/.test(t)?'subtracao':/ler|vogal|silab/.test(t)?'leitura':/escrev|palavra|ortograf/.test(t)?'escrita':'adicao';
    progress.tutorTasks=Array.from({length:count},()=>makeTutorTask(kind));tutorTaskAnswers={};
    return `Preparei ${count} exercício(s) para você! ✨ Eles apareceram logo abaixo da conversa. Responda para conferir as explicações e ganhar pontos.`;
  }
  if(nums.length>=2){let op=null;if(/\+|mais|somar|soma/.test(t))op='+';else if(/\-|menos|subtrair/.test(t))op='−';else if(/\*|×|vezes|multiplicar/.test(t))op='×';else if(/\/|÷|dividir|dividido/.test(t))op='÷';if(op){const [a,b]=nums;const n=op==='+'?a+b:op==='−'?a-b:op==='×'?a*b:b===0?null:a/b;return n===null?'Não é possível dividir por zero. Escolha outro divisor.':`Vamos calcular juntos! ${a} ${op} ${b} = ${Number(n.toFixed(5))}. Quer que eu explique outra operação?`;}}
  if(/divis/.test(t))return 'Divisão é repartir em partes iguais. Imagine 12 balas divididas entre 3 crianças: cada uma recebe 4. Assim, 12 ÷ 3 = 4. Peça: "Me passe 3 contas de divisão".';
  if(/multip|tabuada/.test(t))return 'Multiplicar é somar quantidades iguais. Exemplo: 3 × 4 significa 4 + 4 + 4 = 12. Você pode imaginar três grupos de quatro estrelas.';
  if(/subtra|menos/.test(t))return 'Subtrair é retirar uma parte de um total. Se você tem 9 lápis e empresta 3, ficam 9 − 3 = 6 lápis.';
  if(/soma|adicao|matemat|numero/.test(t))return 'Na adição, juntamos quantidades. Exemplo: 5 + 3 = 8. Tente perguntar "Quanto é 12 + 7?" ou peça exercícios de matemática.';
  if(/silab/.test(t))return 'As sílabas são pedacinhos que pronunciamos dentro das palavras. Exemplos: BO-LA tem duas sílabas; CA-DEI-RA tem três. Vamos praticar no menu Aprender a Ler!';
  if(/vogal|alfabet|letra|aprender a ler|leitura/.test(t))return 'As vogais são A, E, I, O e U. Juntando uma consoante com uma vogal, podemos formar sílabas: B + A = BA; BA + LA = BALA. Que tal abrir Aprender a Ler?';
  if(/escrev|escrit|ortograf|frase|palavra/.test(t))return 'Uma frase começa com letra maiúscula e termina com pontuação. Exemplo: "O gato dorme." Para escrever melhor, comece formando palavras e depois pequenas frases.';
  if(/historia|conto|livro/.test(t))return 'Eu adoro histórias! No Clube da Leitura, você encontra "A estrela curiosa", "O coelho e a semente" e "O barco de papel". Depois da leitura, responda à pergunta!';
  if(/oi|ola|bom dia|boa tarde|boa noite/.test(t))return `Olá, ${progress.name}! 😊 Sobre o que você quer aprender? Posso ajudar com vogais, sílabas, escrita, operações matemáticas e exercícios.`;
  return 'Ainda não tenho uma explicação programada para esse assunto. Você pode perguntar sobre vogais, sílabas, frases, adição, subtração, multiplicação, divisão, histórias ou pedir até 5 exercícios. Para respostas livres sobre qualquer tema, seria necessária uma integração de IA.';
}
function makeTutorTask(kind){const a=2+Math.floor(Math.random()*9), b=2+Math.floor(Math.random()*9);let question,correct,explain;
  if(kind==='multiplicacao'){question=`Quanto é ${a} × ${b}?`;correct=a*b;explain=`${a} grupos de ${b} dão ${correct}.`;}
  else if(kind==='subtracao'){question=`Quanto é ${a+b} − ${b}?`;correct=a;explain=`${a+b} − ${b} = ${a}.`;}
  else if(kind==='divisao'){question=`Quanto é ${a*b} ÷ ${b}?`;correct=a;explain=`${a*b} dividido por ${b} é ${a}.`;}
  else if(kind==='leitura'){return {id:uuid(),question:'Qual das letras abaixo é uma vogal?',options:['M','A','R'],answer:1,explain:'A letra A é uma vogal.'};}
  else if(kind==='escrita'){return {id:uuid(),question:'Qual palavra está escrita corretamente?',options:['Caza','Casa','Cassa'],answer:1,explain:'A palavra CASA é escrita com S.'};}
  else{question=`Quanto é ${a} + ${b}?`;correct=a+b;explain=`${a} + ${b} = ${correct}.`;}
  const values=[correct,correct+2,Math.max(0,correct-1)];values.sort(()=>Math.random()-.5);return {id:uuid(),question,options:values.map(String),answer:values.indexOf(correct),explain};
}
function profilePage(){return banner('SOBRE VOCÊ','Meu Perfil 👤','Seu cantinho de aprendizagem e suas conquistas.','avatar-estudante.png')+`<div class="profile-grid"><section class="panel"><img src="${profileImage()}" alt="Foto de perfil" class="profile-photo"><h2 class="profile-name">${esc(progress.name)}</h2><p class="profile-role">${me.role==='professor'?'🎓 Professor(a)':'🎒 Aluno(a)'}</p><div class="form-stack"><div class="form-row"><label for="newAvatar">Escolher foto de perfil</label><input type="file" id="newAvatar" accept="image/png,image/jpeg,image/webp" aria-label="Enviar foto de perfil"></div></div><p class="section-note">A foto é reduzida e salva somente neste navegador.</p></section><div class="profile-main"><section class="panel"><h2>Minhas informações</h2><form class="form-stack" id="profileForm"><div class="form-row"><label for="profileName">Nome</label><input id="profileName" value="${esc(progress.name)}" maxlength="48" required></div><div class="form-row"><label for="profileClass">Turma</label><input id="profileClass" value="${esc(progress.className)}" maxlength="45" required></div><div class="form-row"><label>Usuário</label><input disabled value="${esc(me.username)}"></div><button type="submit" class="primary-button">Salvar alterações</button></form></section><section class="panel"><h2>📊 Meu desempenho</h2><div class="stat-grid"><div class="stat-box"><strong>${progress.points}</strong><small>Pontos</small></div><div class="stat-box"><strong>${progress.completed.length}</strong><small>Atividades</small></div><div class="stat-box"><strong>${Math.floor(progress.points/100)+1}</strong><small>Nível</small></div></div><h3 style="margin-top:24px">Histórico de aprendizagem</h3>${progress.history.length?progress.history.slice(0,12).map(h=>`<div class="history-row"><span>${esc(h.title)}<br><small>${esc(h.date)}</small></span><strong style="color:#60ecc2">+${h.points} ★</strong></div>`).join(''):'<p class="muted">Você ainda não concluiu nenhuma atividade. Comece pela página de aprendizagem!</p>'}</section></div></div>`;}
function roster(){return loadJSON(rosterKey(me.username),[]);}
function teacherPage(){if(me.role!=='professor')return dashboard();const students=roster();const bank=loadJSON(QUESTIONS_KEY,[]).filter(q=>q.author===me.username);return banner('GESTÃO PEDAGÓGICA','Área do Professor 🎓','Cadastre estudantes, acompanhe seus resultados locais e crie novas atividades.','professor-robot.png')+`<div class="teacher-grid"><section class="panel"><h2>👩‍🎓 Cadastrar aluno na turma</h2><form id="studentForm" class="form-stack"><div class="form-row"><label for="studentName">Nome do aluno</label><input id="studentName" minlength="2" maxlength="48" placeholder="Ex.: Ana Beatriz" required></div><div class="form-row"><label for="studentClass">Turma</label><input id="studentClass" maxlength="45" value="${esc(progress.className)}" required></div><button class="primary-button" type="submit">Adicionar aluno +</button></form><h3 style="margin-top:23px">Alunos cadastrados (${students.length})</h3>${students.length?students.map(item=>{const matching=accounts.find(a=>a.role==='aluno'&&normalize(a.name)===normalize(item.name));const st=matching?loadJSON(profileKey(matching.username),null):null;return `<div class="list-entry"><span><strong>${esc(item.name)}</strong><small>${esc(item.className)} • ${st?`${st.points||0} pontos / ${st.completed?.length||0} atividades`:'sem perfil vinculado neste navegador'}</small></span><button type="button" class="ghost-button" data-remove-student="${item.id}" aria-label="Remover aluno">✕</button></div>`}).join(''):'<p class="muted">Sua turma ainda não tem alunos cadastrados.</p>'}<p class="section-note">O acompanhamento automático aparece quando o aluno também cria um perfil neste mesmo navegador, com o mesmo nome. Não há sincronização entre celulares.</p></section>
  <section class="panel"><h2>✏️ Criar atividade</h2><form id="teacherQuestionForm" class="form-stack"><div class="form-row"><label for="teacherSubject">Disciplina</label><select id="teacherSubject"><option value="ler">Aprender a ler</option><option value="escrever">Aprender a escrever</option><option value="matematica">Matemática</option></select></div><div class="form-row"><label for="teacherTitle">Nome da atividade</label><input id="teacherTitle" maxlength="70" placeholder="Ex.: Vogais e palavras" required></div><div class="form-row"><label for="teacherQuestion">Pergunta</label><textarea id="teacherQuestion" maxlength="260" rows="2" placeholder="Escreva a pergunta..." required></textarea></div><div class="form-row"><label for="answer0">Alternativa A</label><input id="answer0" maxlength="120" required></div><div class="form-row"><label for="answer1">Alternativa B</label><input id="answer1" maxlength="120" required></div><div class="form-row"><label for="answer2">Alternativa C</label><input id="answer2" maxlength="120" required></div><div class="form-row"><label for="correctChoice">Resposta correta</label><select id="correctChoice"><option value="0">Alternativa A</option><option value="1">Alternativa B</option><option value="2">Alternativa C</option></select></div><div class="form-row"><label for="teacherExplanation">Explicação</label><textarea id="teacherExplanation" maxlength="260" rows="2" required placeholder="Explique a resposta correta..."></textarea></div><button class="primary-button">Salvar atividade</button></form></section></div><section class="panel" style="margin-top:18px"><h2>📋 Minhas atividades criadas (${bank.length})</h2>${bank.length?bank.map(item=>`<div class="list-entry"><div><strong>${esc(item.title)}</strong><small>${esc(SUBJECTS[item.subject]?.name||'Atividade')}</small></div><div class="buttons-row"><button class="ghost-button" data-quiz="${esc(item.id)}">Testar</button><button class="ghost-button" data-remove-question="${esc(item.id)}">Excluir</button></div></div>`).join(''):'<p class="muted">Crie uma questão para que ela apareça nas atividades de todos os perfis locais deste navegador.</p>'}</section>`;}
function searchPage(){const term=normalize(searchTerm);const qs=questions().filter(q=>normalize(`${q.title} ${q.question} ${SUBJECTS[q.subject]?.name}`).includes(term));const bs=STORIES.filter(st=>normalize(`${st.title} ${st.text}`).includes(term));return banner('BUSCA DE CONTEÚDOS',`Resultados para “${esc(searchTerm)}”`,'Encontre atividades e histórias disponíveis no EducaMente.')+`<div class="content-grid">${qs.map(q=>`<button class="topic-card" data-quiz="${esc(q.id)}"><span class="topic-icon">${SUBJECTS[q.subject]?.icon||'📚'}</span><h3>${esc(q.title)}</h3><p>${esc(q.question)}</p><span class="topic-cta">Abrir questão →</span></button>`).join('')}${bs.map(st=>`<button class="topic-card" data-story="${st.id}"><span class="topic-icon">${st.icon}</span><h3>${st.title}</h3><p>História do Clube da Leitura</p><span class="topic-cta">Ler história →</span></button>`).join('')}</div>${qs.length+bs.length===0?'<div class="panel search-empty">Nenhum resultado encontrado. Experimente "vogais", "adição", "história", "escrita" ou "divisão".</div>':''}`;}
function render(){if(!me || !progress)return;renderShell();let html;if(activeQuiz)html=quizPage();else if(activeStory)html=storyPage();else html=({inicio:dashboard,aprender:learning,ler:()=>subjectPage('ler'),escrever:()=>subjectPage('escrever'),matematica:()=>subjectPage('matematica'),clube:library,conquistas:achievements,tutor:tutorPage,perfil:profilePage,'area-professor':teacherPage,busca:searchPage}[route]||dashboard)();$('#appView').innerHTML=html;if(route==='tutor'){const box=$('#chatBox');if(box)box.scrollTop=box.scrollHeight;}}
function answerQuiz(index){const q=questionById(activeQuiz);if(!q||selectedAnswer!==null)return;selectedAnswer=index;if(index===q.answer){if(markDone(q.id,q.title,q.subject))notify('Parabéns! Você ganhou 15 pontos! ★');else notify('Resposta certa! Essa atividade já foi pontuada.');}render();}
function answerStory(index){const st=STORIES.find(s=>s.id===activeStory);if(!st||selectedAnswer!==null)return;selectedAnswer=index;if(index===st.answer){if(markDone(st.id,st.title,'leitura',20))notify('História concluída! +20 pontos ★');else notify('Muito bem! Você já tinha concluído essa história.');}render();}
function answerTutor(id,idx){const task=progress.tutorTasks.find(q=>q.id===id);if(!task||tutorTaskAnswers[id]!==undefined)return;tutorTaskAnswers[id]=idx;if(idx===task.answer){markDone(id,task.question,'professor virtual',10);notify('Resposta correta! +10 pontos ★');}render();}



const PROFESSOR_API = '/.netlify/functions/professor';
let professorRespondendo = false;

async function sendChat(message) {
  const pergunta = clean(message);
  if (!pergunta || professorRespondendo || !progress) return;

  const perfilAtual = progress;
  const historico = perfilAtual.chat.slice(-8).map(m => ({
    role: m.who === 'bot' ? 'model' : 'user',
    text: m.text
  }));

  perfilAtual.chat.push({who:'user',text:pergunta});
  professorRespondendo = true;
  saveProgress();
  render();

  try {
    const respostaHTTP = await fetch(PROFESSOR_API, {
      method: 'POST',
      headers: {'Content-Type':'application/json'},
      body: JSON.stringify({message:pergunta,history:historico})
    });
    let dados;
    try { dados = await respostaHTTP.json(); }
    catch { throw new Error('Resposta inválida do servidor.'); }
    if (!respostaHTTP.ok) throw new Error(dados.error || `Erro HTTP ${respostaHTTP.status}`);
    if (!dados.reply || !clean(dados.reply)) throw new Error('O professor não retornou uma resposta.');
    perfilAtual.chat.push({who:'bot',text:clean(dados.reply)});
  } catch (erro) {
    console.error('Erro do Professor Virtual:',erro);
    perfilAtual.chat.push({who:'bot',text:'Não consegui responder agora. '+erro.message});
  } finally {
    professorRespondendo = false;
    perfilAtual.chat = perfilAtual.chat.slice(-50);
    if (progress === perfilAtual) { saveProgress(); render(); }
  }
}

function startQuiz(id){const q=questionById(id);if(!q){notify('Atividade não encontrada.');return;}route=q.subject;activeQuiz=id;activeStory=null;selectedAnswer=null;render();window.scrollTo(0,0);}
function startStory(id){if(!STORIES.some(st=>st.id===id))return;route='clube';activeStory=id;activeQuiz=null;selectedAnswer=null;render();window.scrollTo(0,0);}

async function digest(password, salt) {
  if (!globalThis.crypto?.subtle) {
    throw new Error(
      "O cadastro precisa de uma conexão HTTPS segura. " +
      "Abra o EducaMente por HTTPS para continuar."
    );
  }

  const encoded = new TextEncoder().encode(salt + ":" + password);

  const bytes = await crypto.subtle.digest("SHA-256", encoded);

  return Array.from(new Uint8Array(bytes))
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
} 
function setAuthMode(mode){authMode=mode;$('#registerOnly').hidden=mode==='login';document.querySelectorAll('[data-auth]').forEach(btn=>btn.classList.toggle('active',btn.dataset.auth===mode));$('#authHeading').textContent=mode==='login'?'Que bom ter você aqui! 👋':'Vamos criar sua conta! ✨';$('#authSubheading').textContent=mode==='login'?'Entre no seu perfil e continue sua aventura.':'Escolha seu perfil para começar a aprender.';$('#authSubmit').innerHTML=mode==='login'?'Entrar no EducaMente <span>→</span>':'Criar meu cadastro <span>→</span>';$('#authPassword').autocomplete=mode==='login'?'current-password':'new-password';$('#authError').textContent='';}
function showApplication(){$('#authScreen').hidden=true;$('#appShell').hidden=false;route='inicio';activeQuiz=null;activeStory=null;render();}
function showAccess(){me=null;progress=null;sessionStorage.removeItem(SESSION_KEY);$('#appShell').hidden=true;$('#authScreen').hidden=false;$('#authForm').reset();setAuthMode('login');}
async function submitAuth(event){event.preventDefault();const username=normalize($('#authUser').value);const pwd=$('#authPassword').value;const error=$('#authError');error.textContent='';if(!/^[a-z0-9_.-]{3,25}$/.test(username)){error.textContent='Use de 3 a 25 caracteres no usuário: letras, números, ponto, hífen ou _. ';return;}if(pwd.length<4){error.textContent='Digite uma senha de demonstração com pelo menos 4 caracteres.';return;}
 const submit=$('#authSubmit');submit.disabled=true;
 try{
  let account=accounts.find(a=>a.username===username);
  if(authMode==='cadastro'){
   const name=clean($('#registerName').value);const role=$('#registerRole').value;
   if(name.length<2){error.textContent='Digite seu nome com pelo menos duas letras.';return;}
   if(account){error.textContent='Este usuário já existe. Escolha outro nome de usuário.';return;}
   const salt=uuid();const hash=await digest(pwd,salt);account={username,name,role,salt,hash};accounts.push(account);storeJSON(ACCOUNTS_KEY,accounts);
   let profile=newProgress(account);
   // Recupera progresso da versão anterior, se houver perfil com mesmo nome e papel.
   const legacy=loadJSON('educamente-contas',[]).find(a=>normalize(a.name)===normalize(name)&&a.role===role);
   if(legacy){const old=loadJSON('educamente-perfil-'+legacy.id,{});profile={...profile,points:Number(old.points)||0,completed:Array.isArray(old.completed)?old.completed:[],history:Array.isArray(old.history)?old.history:[],className:old.className||'Turma A',chat:Array.isArray(old.chat)?old.chat:[]};}
   storeJSON(profileKey(username),profile);
  }else{
   if(!account){error.textContent='Usuário não encontrado. Clique em Criar cadastro.';return;}
   const hash=await digest(pwd,account.salt);
   if(account.hash!==hash){error.textContent='Senha incorreta. Confira a senha que você cadastrou neste navegador.';return;}
  }
  me=account;progress={...newProgress(account),...loadJSON(profileKey(username),{})};sessionStorage.setItem(SESSION_KEY,username);showApplication();notify(`Bem-vindo(a), ${progress.name}!`);
 }catch(errorCaught){error.textContent=errorCaught.message||'Não foi possível entrar neste navegador.';}finally{submit.disabled=false;}
}

// Delegação de eventos: os botões continuam funcionando mesmo após mudar de página.
document.addEventListener('click',event=>{
 const button=event.target.closest('button');if(!button)return;
 if(button.dataset.auth){setAuthMode(button.dataset.auth);return;}
 if(button.id==='togglePassword'){const input=$('#authPassword');input.type=input.type==='password'?'text':'password';button.textContent=input.type==='password'?'◉':'⊘';return;}
 if(button.id==='logoutButton'){showAccess();notify('Você saiu do perfil local.');return;}
 if(button.id==='menuButton'){$('#sidebar').classList.toggle('open');$('#scrim').hidden=!$('#sidebar').classList.contains('open');return;}
 if(button.id==='notificationButton'){switchPage('aprender');notify('Escolha uma atividade para começar!');return;}
 if(!me)return;
 if(button.dataset.go){switchPage(button.dataset.go);return;}
 if(button.dataset.quiz){startQuiz(button.dataset.quiz);return;}
 if(button.dataset.story){startStory(button.dataset.story);return;}
 if(button.dataset.answer!==undefined){answerQuiz(Number(button.dataset.answer));return;}
 if(button.dataset.storyAnswer!==undefined){answerStory(Number(button.dataset.storyAnswer));return;}
 if(button.dataset.retry){selectedAnswer=null;render();return;}
 if(button.dataset.retryStory){selectedAnswer=null;render();return;}
 if(button.dataset.suggest){sendChat(button.dataset.suggest);return;}
 if(button.dataset.tutorId){answerTutor(button.dataset.tutorId,Number(button.dataset.tutorAnswer));return;}
 if(button.id==='clearChat'){progress.chat=[];saveProgress();render();notify('Conversa limpa.');return;}
 if(button.id==='newTutorTasks'){progress.tutorTasks=[];tutorTaskAnswers={};saveProgress();render();return;}
 if(button.dataset.speak!==undefined){const idx=Number(button.dataset.speak);speak(idx===-1?`Olá, ${progress.name}! Sou o Professor Virtual do EducaMente.`:progress.chat[idx]?.text||'');return;}
 if(button.dataset.speakStory){const st=STORIES.find(x=>x.id===button.dataset.speakStory);if(st)speak(st.text);return;}
 if(button.dataset.removeStudent){if(me.role!=='professor')return;storeJSON(rosterKey(me.username),roster().filter(x=>x.id!==button.dataset.removeStudent));render();notify('Aluno removido da turma.');return;}
 if(button.dataset.removeQuestion){if(me.role!=='professor')return;const all=loadJSON(QUESTIONS_KEY,[]);storeJSON(QUESTIONS_KEY,all.filter(x=>!(x.id===button.dataset.removeQuestion&&x.author===me.username)));render();notify('Atividade excluída.');return;}
});
$('#scrim').addEventListener('click',()=>{$('#sidebar').classList.remove('open');$('#scrim').hidden=true;});
document.addEventListener('submit',event=>{
 if(event.target.id==='authForm'){submitAuth(event);return;}
 if(event.target.id==='searchForm'){event.preventDefault();if(!me)return;searchTerm=clean($('#searchInput').value);if(!searchTerm)return;switchPage('busca');return;}
 if(!me)return;
 if(event.target.id==='chatForm'){event.preventDefault();sendChat($('#chatInput').value);return;}
 if(event.target.id==='profileForm'){event.preventDefault();progress.name=clean($('#profileName').value)||progress.name;progress.className=clean($('#profileClass').value)||'Turma A';saveProgress();render();notify('Informações atualizadas!');return;}
 if(event.target.id==='studentForm'){event.preventDefault();if(me.role!=='professor')return;const name=clean($('#studentName').value),className=clean($('#studentClass').value);if(name.length<2||!className){notify('Preencha o nome do aluno e sua turma.');return;}const all=roster();all.push({id:uuid(),name,className});storeJSON(rosterKey(me.username),all);render();notify('Aluno cadastrado na turma!');return;}
 if(event.target.id==='teacherQuestionForm'){event.preventDefault();if(me.role!=='professor')return;const subject=$('#teacherSubject').value,title=clean($('#teacherTitle').value),question=clean($('#teacherQuestion').value),options=[0,1,2].map(i=>clean($('#answer'+i).value)),answer=Number($('#correctChoice').value),explain=clean($('#teacherExplanation').value);if(!title||!question||options.some(x=>!x)||!explain){notify('Preencha todos os campos da atividade.');return;}const all=loadJSON(QUESTIONS_KEY,[]);all.push({id:uuid(),subject,title,question,options,answer,explain,author:me.username});storeJSON(QUESTIONS_KEY,all);render();notify('Atividade criada e disponível neste navegador!');return;}
});
document.addEventListener('change',event=>{if(event.target.id!=='newAvatar'||!me)return;const file=event.target.files?.[0];if(!file)return;if(!file.type.startsWith('image/')){notify('Escolha uma imagem PNG, JPG ou WebP.');return;}if(file.size>8*1024*1024){notify('A foto deve ter até 8 MB antes de ser reduzida.');return;}const source=URL.createObjectURL(file);const img=new Image();img.onload=()=>{const canvas=document.createElement('canvas');canvas.width=180;canvas.height=180;const ctx=canvas.getContext('2d');const side=Math.min(img.width,img.height);ctx.drawImage(img,(img.width-side)/2,(img.height-side)/2,side,side,0,0,180,180);progress.avatar=canvas.toDataURL('image/jpeg',.75);URL.revokeObjectURL(source);saveProgress();render();notify('Foto atualizada!');};img.onerror=()=>{URL.revokeObjectURL(source);notify('Não foi possível abrir a imagem.');};img.src=source;});

$('#authForm').addEventListener('submit',()=>{});
(function start(){const username=sessionStorage.getItem(SESSION_KEY);if(username){accounts=loadJSON(ACCOUNTS_KEY,[]);const account=accounts.find(a=>a.username===username);if(account){me=account;progress={...newProgress(account),...loadJSON(profileKey(username),{})};showApplication();return;}}showAccess();})();
