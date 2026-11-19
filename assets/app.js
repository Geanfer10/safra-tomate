const ico={
 caixa:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 8l-9-5-9 5v8l9 5 9-5z"/><path d="M3 8l9 5 9-5M12 13v8"/></svg>',
 foto:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M4 7h3l2-3h6l2 3h3v13H4z"/><circle cx="12" cy="13" r="4"/></svg>',
 clip:'<svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M21 11l-8.5 8.5a5 5 0 01-7-7L14 4a3.5 3.5 0 015 5l-8.5 8.5a2 2 0 01-3-3L15 7"/></svg>',
 doc:'<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><path d="M6 2h9l5 5v15H6z"/><path d="M14 2v6h6"/></svg>'
};
const DEPTS={"Mecânica":"--mec","Elétrica":"--ele","Automação":"--aut","Civil":"--civ"};
const STATUS_COR={"Não iniciado":"--gray","Em andamento":"--warn","Aguardando material":"--aut","Atrasado":"--bad","Concluído":"--ok","Cancelado":"--gray"};
// Dados de EXEMPLO: usados só quando ainda não existe data/dados.json (pré-visualização local).
const EXEMPLO_BASE=[
 {id:1,nome:"Revisão geral das bombas de polpa",dept:"Mecânica",safra:"2027",status:"Não iniciado",prioridade:"Crítica",tipo:"Serviço interno",area:"Linha de extração",ini:"2027-02-01",fim:"2027-03-15",prev:18000,real:null,compra:"Sem compra"},
 {id:2,nome:"Troca de rolamentos e selos do triturador",dept:"Mecânica",safra:"2027",status:"Não iniciado",prioridade:"Alta",tipo:"Aquisição",area:"Recepção / triturador",ini:"2027-01-15",fim:"2027-02-28",prev:32000,real:null,compra:"Em cotação"},,
 {id:4,nome:"Revisão dos painéis e CCMs da linha de extração",dept:"Elétrica",safra:"2027",status:"Não iniciado",prioridade:"Crítica",tipo:"Serviço interno",area:"Linha de extração",ini:"2027-02-01",fim:"2027-03-01",prev:12000,real:null,compra:"Sem compra"},
 {id:5,nome:"Aquisição de motores reserva (estoque de safra)",dept:"Elétrica",safra:"2027",status:"Em andamento",prioridade:"Alta",tipo:"Aquisição",area:"Almoxarifado",ini:"2026-11-01",fim:"2027-01-31",prev:60000,real:null,compra:"RC aberta"},,
 {id:7,nome:"Calibração de instrumentos (temperatura/pressão/Brix)",dept:"Automação",safra:"2027",status:"Não iniciado",prioridade:"Crítica",tipo:"Serviço terceirizado",area:"Evaporadores / esterilizador",ini:"2027-03-01",fim:"2027-03-31",prev:15000,real:null,compra:"Em cotação"},
 {id:8,nome:"Backup e atualização dos programas de CLP/IHM",dept:"Automação",safra:"2027",status:"Não iniciado",prioridade:"Alta",tipo:"Serviço interno",area:"Linha de extração",ini:"2027-01-10",fim:"2027-02-10",prev:0,real:null,compra:"Sem compra"},
 {id:9,nome:"Recuperação de piso da área de recepção",dept:"Civil",safra:"2027",status:"Não iniciado",prioridade:"Alta",tipo:"Serviço terceirizado",area:"Pátio de recepção",ini:"2026-12-01",fim:"2027-02-15",prev:85000,real:null,compra:"Em cotação"},
];
// Foto ilustrativa (no painel real vem da coluna "Foto do local" do Monday)
const fotoEx=(txt,cor)=>"data:image/svg+xml;charset=utf-8,"+encodeURIComponent(`<svg xmlns="http://www.w3.org/2000/svg" width="640" height="400" viewBox="0 0 640 400"><defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#cfd9d3"/><stop offset="1" stop-color="#8fa398"/></linearGradient></defs><rect width="640" height="400" fill="url(#g)"/><rect y="250" width="640" height="150" fill="#6d7f74"/><rect x="70" y="140" width="220" height="130" rx="6" fill="${cor}" opacity=".85"/><rect x="330" y="170" width="240" height="100" rx="6" fill="#55665c"/><circle cx="180" cy="205" r="34" fill="#e9efe9" opacity=".7"/><text x="320" y="370" text-anchor="middle" font-family="Arial" font-size="22" fill="#fff">${txt}</text></svg>`);
const EXTRAS={
 1:{os:"OS-2027-0004",fotos:[{nome:"Bomba de polpa – estado atual",url:fotoEx("Foto de exemplo · bomba de polpa","#1E9350")}]},
 2:{orcamentos:[{nome:"Orçamento Fornecedor A.pdf",url:"#"},{nome:"Orçamento Fornecedor B.pdf",url:"#"}]},
 5:{os:"OS-2026-0311",orcamentos:[{nome:"Cotação motores WEG.pdf",url:"#"},{nome:"Cotação motores distribuidor.pdf",url:"#"},{nome:"Mapa comparativo.xlsx",url:"#"}]},
 7:{orcamentos:[{nome:"Proposta laboratório de calibração.pdf",url:"#"}]},
 9:{fotos:[{nome:"Piso da recepção",url:fotoEx("Foto de exemplo · piso da recepção","#8A6A4F")}],orcamentos:[{nome:"Orçamento recuperação de piso.pdf",url:"#"}]},
};
const EXEMPLO=EXEMPLO_BASE.map(d=>Object.assign({},d,EXTRAS[d.id]||{}));
let DADOS=[];
const HOJE=new Date(); HOJE.setHours(0,0,0,0);
const st={safra:null,kpi:"todas",dept:null,foco:null,tipo:"",mf:"todos",md:""};
// Valores sempre por extenso no padrão brasileiro: R$ 44.450,00
const brl=v=>v==null?"—":Number(v).toLocaleString("pt-BR",{style:"currency",currency:"BRL",minimumFractionDigits:2,maximumFractionDigits:2});
const mil=brl;
const dt=s=>s?s.slice(8,10)+"/"+s.slice(5,7)+"/"+s.slice(2,4):"—";
const esc=s=>String(s??"").replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"}[c]));
const efetivo=d=>(d.status!=="Concluído"&&d.status!=="Cancelado"&&d.fim&&new Date(d.fim+"T00:00")<HOJE)?"Atrasado":d.status;
const ehPrio=d=>d.prioridade==="Crítica"||d.prioridade==="Alta";
const aberta=d=>d.status!=="Concluído"&&d.status!=="Cancelado";
const sum=(a,f)=>a.reduce((s,x)=>s+(f(x)||0),0);
const diasAte=s=>Math.round((new Date(s+"T00:00")-HOJE)/864e5);
const safras=()=>[...new Set(DADOS.map(d=>d.safra))].sort();

// Indicadores clicáveis: cada um filtra a lista de atividades
// "todas" fica fora dos cartões: é o estado padrão (sem filtro) da lista de atividades
/* ---------- Orçamento: cotações (análise) ou valor manual ----------
   Com cotações válidas (não recusadas): faixa menor–maior; com uma aprovada: o valor dela.
   Sem cotações: o "Orçamento previsto" digitado no Monday. */
function cotacoesHTML(d){
  const C=(d.cotacoes||[]);if(!C.length)return "";
  const val=C.filter(c=>c.valor!=null&&c.analise!=="Recusada").map(c=>c.valor);
  const mn=val.length?Math.min(...val):null, mx=val.length?Math.max(...val):null;
  const hoje=new Date();hoje.setHours(0,0,0,0);
  const vali=v=>{if(!v)return"—";const n=Math.round((new Date(v+"T00:00")-hoje)/864e5);const t=dt(v);
    return n<0?`<span class="cot-venc">${t} · vencida</span>`:n<=7?`<span class="cot-venc perto">${t} · ${n}d</span>`:t};
  const ord={"Aprovada":0,"Em análise":1,"Recusada":2};
  const rows=C.slice().sort((a,b)=>(ord[a.analise]??1)-(ord[b.analise]??1)||(a.valor??1e15)-(b.valor??1e15)).map(c=>{
    const tag=c.analise!=="Recusada"&&val.length>1?(c.valor===mn?'<span class="cot-flag min">menor</span>':c.valor===mx?'<span class="cot-flag max">maior</span>':""):"";
    return `<tr class="cot-${c.analise==="Aprovada"?"ok":c.analise==="Recusada"?"rec":"an"}">
      <td><b>${esc(c.forn)||esc(c.nome)}</b>${c.prop?`<div class="muted">${esc(c.prop)}</div>`:""}${c.arquivo&&c.arquivo.url?`<a class="cot-arq" href="${esc(c.arquivo.url)}" target="_blank" rel="noopener noreferrer">${ico.doc}proposta</a>`:""}</td>
      <td class="r num">${c.valor!=null?brl(c.valor):"—"} ${tag}</td>
      <td>${esc(c.frete)||"—"}</td><td>${esc(c.prazo)||"—"}</td><td class="num">${vali(c.validade)}</td><td>${esc(c.pag)||"—"}</td>
      <td><span class="cot-an" data-a="${esc(c.analise)}">${esc(c.analise)}</span></td></tr>
      ${c.obs?`<tr class="cot-obs"><td colspan="7">${esc(c.obs)}</td></tr>`:""}`}).join("");
  const dif=val.length>1?`<div class="cot-res">Diferença entre a maior e a menor: <b class="num">${brl(mx-mn)}</b> (${((mx-mn)/mn*100).toFixed(1).replace(".",",")}%)</div>`:"";
  return `<div class="gv-sec"><h3>${ico.clip} Cotações · ${C.length}</h3>${dif}<div class="mat-wrap"><table class="mat cot"><thead><tr><th>Fornecedor</th><th class="r">Valor</th><th>Frete</th><th>Prazo</th><th>Validade</th><th>Pagamento</th><th>Análise</th></tr></thead><tbody>${rows}</tbody></table></div></div>`;
}
function prepOrc(d){
  const cots=(d.cotacoes||[]).filter(c=>c.valor!=null&&c.analise!=="Recusada");
  const apr=cots.find(c=>c.analise==="Aprovada");
  const mats=d.materiais||[], matP=mats.filter(m=>m.vtot>0);
  if(apr){d.pMin=d.pMax=apr.valor;d.orcTipo="aprovado";d.orcN=cots.length}
  else if(cots.length){const v=cots.map(c=>c.valor);d.pMin=Math.min(...v);d.pMax=Math.max(...v);d.orcTipo="cotado";d.orcN=cots.length}
  else if(matP.length){const t=matP.reduce((a,m)=>a+m.vtot,0);d.pMin=d.pMax=t;d.orcTipo="materiais";d.orcN=matP.length;d.matN=mats.length}
  else if(d.prev>0){d.pMin=d.pMax=d.prev;d.orcTipo="manual";d.orcN=0}
  else{d.pMin=d.pMax=0;d.orcTipo=null;d.orcN=0}
  return d;
}
const prep=l=>(l||[]).map(prepOrc);
const faixaR=(a,b)=>!a&&!b?"—":Math.round(a*100)===Math.round(b*100)?brl(a):`${brl(a)} – ${brl(b)}`;
const sMin=l=>sum(l,d=>d.pMin), sMax=l=>sum(l,d=>d.pMax);
function celOrc(d){
  if(!d.orcTipo)return "—";
  if(d.orcTipo==="aprovado")return `<div class="orc"><span class="orc-tag ok">Aprovado</span><b class="num">${brl(d.pMin)}</b></div>`;
  if(d.orcTipo==="cotado")return `<div class="orc"><span class="orc-tag">Orçado · ${d.orcN} cotaç${d.orcN>1?"ões":"ão"}</span><b class="num">${faixaR(d.pMin,d.pMax)}</b></div>`;
  if(d.orcTipo==="materiais")return `<div class="orc"><span class="orc-tag${d.orcN<d.matN?" parc":""}">Orçado · ${d.orcN} de ${d.matN} itens</span><b class="num">${brl(d.pMin)}</b></div>`;
  return `<span class="num">${brl(d.pMin)}</span>`;
}
const KPI_TODAS={id:"todas",l:"Atividades",k:"--brand",f:()=>true};
const KPIS=[
 {id:"atrasadas",l:"Atrasadas",k:"--bad",f:d=>efetivo(d)==="Atrasado"},
 {id:"prioridade",l:"Prioridade alta",k:"--tomato",f:d=>ehPrio(d)&&aberta(d)},
 {id:"andamento",l:"Em andamento",k:"--warn",f:d=>d.status==="Em andamento"||d.status==="Aguardando material"},
 {id:"concluidas",l:"Concluídas",k:"--ok",f:d=>d.status==="Concluído"},
 {id:"orcamento",l:"Orçamento",k:"--gold",f:d=>(d.pMax||0)>0}
];
const kpiDe=id=>KPIS.find(k=>k.id===id)||KPI_TODAS;

function render(){
  // Safra inteira (visão geral) ou só o departamento aberto no menu
  // Categoria (tipo de serviço) vale para tudo: KPIs, faixa, departamentos e atividades
  const LS0=DADOS.filter(d=>d.safra===st.safra);
  const LS=st.tipo?LS0.filter(d=>d.tipo===st.tipo):LS0;
  const L=st.dept?LS.filter(d=>d.dept===st.dept):LS;
  categorias(st.dept?LS0.filter(d=>d.dept===st.dept):LS0);
  document.getElementById("hoje").textContent=HOJE.toLocaleDateString("pt-BR",{day:"2-digit",month:"long",year:"numeric"});
  const S=safras(), sel=document.getElementById("safras");
  // Com uma safra só não há o que escolher: mostra só o rótulo; o seletor volta quando entrar a próxima safra
  sel.innerHTML=S.length>1?S.map(s=>`<button type="button" data-s="${s}" aria-pressed="${s===st.safra}">Safra ${s}</button>`).join(""):`<button type="button" aria-pressed="true" tabindex="-1" style="cursor:default">Safra ${st.safra}</button>`;
  document.querySelector(".lbl-mini").hidden=S.length<2;
  faixa(L); kpis(L); depts(LS); historico(); tabela(L); materiaisTela(LS0);
  // Contador de atividades em aberto por departamento no menu
  document.querySelectorAll("[data-cnt]").forEach(el=>{const n=LS.filter(d=>d.dept===el.dataset.cnt&&aberta(d)).length;el.textContent=n||""});
  // Visão geral × departamento
  document.getElementById("secDeps").hidden=!!st.dept;
  const ban=document.getElementById("depBanner");ban.hidden=!st.dept;
  if(st.dept){
    const c=DEPTS[st.dept], tot=sMax(LS)||0, p=sMax(L), r=sum(L,d=>d.real);
    ban.style.setProperty("--c",`var(${c})`);
    document.getElementById("dbNome").textContent=st.dept;
    document.getElementById("dbSafra").textContent=st.safra;
    document.getElementById("dbResumo").innerHTML=`<span>Atividades<b>${L.length}</b></span><span>Orçado<b>${faixaR(sMin(L),sMax(L))}</b></span><span>Realizado<b>${brl(r)}</b></span><span>Fatia do orçamento<b>${tot?(p/tot*100).toFixed(0):0}%</b></span>`;
  }
}

const TIPO_COR={"Serviço interno":"--brand","Aquisição":"--ele","Serviço terceirizado":"--aut"};
function categorias(B){
  const tipos=[...new Set([...Object.keys(TIPO_COR),...B.map(d=>d.tipo).filter(Boolean)])];
  const card=(id,nome,lst,cor)=>`<button type="button" class="cat" data-tipo="${esc(id)}" aria-pressed="${st.tipo===id}" style="--k:var(${cor})">
    <span class="cat-n">${esc(nome)}</span><span class="cat-v num">${lst.length}</span>
    <span class="cat-d">${lst.filter(aberta).length} em aberto · ${faixaR(sMin(lst),sMax(lst))}</span></button>`;
  document.getElementById("cats").innerHTML=card("","Todas",B,"--fg")+tipos.map(t=>card(t,t,B.filter(d=>d.tipo===t),TIPO_COR[t]||"--gray")).join("");
  document.getElementById("fTipo").innerHTML=`<option value="">Todas as categorias (${B.length})</option>`+tipos.map(t=>`<option value="${esc(t)}"${st.tipo===t?" selected":""}>${esc(t)} (${B.filter(d=>d.tipo===t).length})</option>`).join("");
}
document.getElementById("fTipo").addEventListener("change",e=>{st.tipo=e.target.value;render()});
function faixa(L){
  const itens=L.filter(d=>ehPrio(d)&&aberta(d)).sort((a,b)=>(a.prioridade==="Crítica"?0:1)-(b.prioridade==="Crítica"?0:1)||(a.fim||"").localeCompare(b.fim||""));
  const fita=document.getElementById("fita");
  if(!itens.length){fita.innerHTML=`<span class="item">Nenhuma atividade crítica ou alta em aberto${st.dept?" em "+st.dept:""} na safra ${st.safra}.</span>`;fita.style.animation="none";return}
  const html=itens.map(d=>{const e=efetivo(d),n=diasAte(d.fim);
    const prazo=!d.fim?"sem prazo definido":e==="Atrasado"?`atrasada ${-n}d`:n<=30?`vence em ${n}d`:`até ${dt(d.fim)}`;
    return `<button type="button" class="item" data-foco="${d.id}"><span class="pri ${d.prioridade==="Alta"?"alta":""}">${esc(d.prioridade)}</span><b>${esc(d.nome)}</b><span class="dep">· ${esc(d.dept)} · ${esc(d.area)}</span><span class="prz">${prazo}</span></button>`}).join("");
  fita.innerHTML=html+html.replace(/<button /g,'<button tabindex="-1" aria-hidden="true" ');
  fita.style.animation="";
  fita.style.setProperty("--dur",Math.max(25,itens.length*9)+"s");
}

function kpis(L){
  const prev=sMax(L), real=sum(L,d=>d.real), fech=L.filter(d=>d.real!=null), prevF=sMax(fech), nCot=L.filter(d=>d.orcTipo==="cotado").length;
  const conc=L.filter(kpiDe("concluidas").f).length, tot=L.length||1;
  const info={
    todas:[L.length,st.dept?`de ${st.dept} na safra ${st.safra}`:`${Object.keys(DEPTS).filter(n=>L.some(d=>d.dept===n)).length} departamentos envolvidos`,null],
    concluidas:[conc,`${Math.round(conc/tot*100)}% da safra`,conc/tot],
    andamento:[L.filter(kpiDe("andamento").f).length,"inclui aguardando material",null],
    atrasadas:[L.filter(kpiDe("atrasadas").f).length,"prazo vencido sem conclusão",null],
    prioridade:[L.filter(kpiDe("prioridade").f).length,`${L.filter(d=>d.prioridade==="Crítica"&&aberta(d)).length} críticas em aberto`,null],
    orcamento:[faixaR(sMin(L),sMax(L)),(nCot?`${nCot} ite${nCot>1?"ns":"m"} com cotações em análise · `:"")+(fech.length?`realizado ${brl(real)}`:"nenhum item fechado ainda"),prev?Math.min(1,real/prev):0]
  };
  document.getElementById("kpis").innerHTML=KPIS.map(k=>{const [v,d,bar]=info[k.id];
    return `<button type="button" class="kpi" style="--k:var(${k.k})" data-kpi="${k.id}" aria-pressed="${st.kpi===k.id}">
      <span class="l">${k.l}</span><span class="v">${v}</span><span class="d">${d}</span>
      ${bar!=null?`<span class="mini"><span style="width:${(bar*100).toFixed(0)}%"></span></span>`:""}
      <span class="ver">Ver atividades →</span></button>`}).join("");
}

const gid=n=>"g-"+Object.keys(DEPTS).indexOf(n);
function depts(L){
  const tot=sMax(L)||1;
  document.getElementById("dsub").textContent="Safra "+st.safra+" · orçado "+faixaR(sMin(L),sMax(L));
  document.getElementById("dcards").innerHTML=Object.entries(DEPTS).map(([n,c])=>{
    const D=L.filter(d=>d.dept===n), p=sMax(D), pm=sMin(D), r=sum(D,d=>d.real), cc=D.filter(d=>d.status==="Concluído").length;
    const pr=D.filter(d=>ehPrio(d)&&aberta(d)).length, at=D.filter(d=>efetivo(d)==="Atrasado").length;
    const pct=D.length?cc/D.length*100:0;
    const al=(pr?`<span class="al crit">${pr} prioritária${pr>1?"s":""}</span>`:"")+(at?`<span class="al atr">${at} atrasada${at>1?"s":""}</span>`:"")+(!pr&&!at&&D.length?`<span class="al ok">Sem pendências críticas</span>`:"");
    return `<button type="button" class="dcard" style="--c:var(${c})" data-d="${n}">
      <h3>${n}<small>${(p/tot*100).toFixed(0)}% do orçamento</small></h3>
      <div class="linha"><span>Atividades concluídas</span><b>${cc}/${D.length}</b></div>
      <div class="bar"><span style="width:${pct}%"></span></div>
      <div class="linha"><span>Previsto</span><b>${brl(p)}</b></div>
      <div class="linha"><span>Realizado</span><b>${brl(r)}</b></div>
      ${al?`<div class="alertas">${al}</div>`:""}
      <span class="ir">Ver atividades de ${n} →</span></button>`}).join("");
}

const resumo=(l,s)=>({s,l,p:sMax(l),r:sum(l,d=>d.real),n:l.length,c:l.filter(d=>d.status==="Concluído").length});
function historico(){
  const S=safras();
  document.getElementById("hist").innerHTML=linhasHist(S.map(s=>resumo(DADOS.filter(d=>d.safra===s),s)),false);
  // Matriz departamento × safra
  const cab=`<thead><tr><th rowspan="2">Departamento</th>${S.map(s=>`<th class="sf" colspan="3">Safra ${s}</th>`).join("")}${S.length>1?`<th class="r" rowspan="2">Variação ${S[S.length-2]}→${S[S.length-1]}</th>`:""}</tr>
    <tr>${S.map(()=>`<th class="r" style="border-left:1px solid var(--line)">Previsto</th><th class="r">Realizado</th><th class="r">Exec.</th>`).join("")}</tr></thead>`;
  const lin=(nome,cor,filtro,cls)=>{const vs=S.map(s=>resumo(DADOS.filter(d=>d.safra===s&&filtro(d)),s));
    const a=vs[vs.length-2],b=vs[vs.length-1],vr=a&&a.p?((b.p-a.p)/a.p*100):null;
    return `<tr class="${cls||""}"><td class="dep" style="--c:var(${cor})">${cor?"<i></i>":""}${nome}</td>${vs.map(v=>`<td class="r num b">${v.p?mil(v.p):"—"}</td><td class="r num">${v.r?mil(v.r):"—"}</td><td class="r num exe">${v.p&&v.r?(v.r/v.p*100).toFixed(0)+"%":"—"}</td>`).join("")}${S.length>1?`<td class="r">${vr==null?'<span class="badge neu">novo</span>':`<span class="badge ${vr>0?"up":"down"}">${vr>0?"+":""}${vr.toFixed(0)}%</span>`}</td>`:""}</tr>`};
  document.getElementById("matriz").innerHTML=cab+"<tbody>"+Object.entries(DEPTS).map(([n,c])=>lin(n,c,d=>d.dept===n)).join("")+lin("Total","",()=>true,"total")+"</tbody>";
  // Blocos por departamento
  document.getElementById("hdepts").innerHTML=Object.entries(DEPTS).map(([n,c])=>
    `<div class="hdep" style="--c:var(${c})"><h3>${n}</h3>${linhasHist(S.map(s=>resumo(DADOS.filter(d=>d.safra===s&&d.dept===n),s)),true)}</div>`).join("");
}
function linhasHist(V,comLista){
  const S=V.map(v=>v.s), mx=Math.max(1,...V.map(v=>Math.max(v.p,v.r)));
  return V.slice().reverse().map(v=>{
    const i=S.indexOf(v.s), ant=i>0?V[i-1]:null;
    const exec=v.p?v.r/v.p*100:0, varPrev=ant&&ant.p?((v.p-ant.p)/ant.p*100):null, desvio=v.r&&v.p?((v.r-v.p)/v.p*100):null;
    if(!v.n) return `<div class="hrow"><div class="ano">${v.s}<small>Sem atividades</small></div><div class="hnums" style="margin:0;align-self:center">Nenhuma atividade registrada nesta safra.</div></div>`;
    const fase=v.c===v.n?"Encerrada":v.r?"Em execução":"Em preparação";
    const ordem={"Concluído":0,"Em andamento":1,"Aguardando material":2,"Não iniciado":3,"Cancelado":4};
    const lista=comLista?`<details class="lst"><summary>Ver ${v.n} atividade${v.n>1?"s":""} da safra ${v.s}</summary><ul>${v.l.slice().sort((a,b)=>(ordem[a.status]??9)-(ordem[b.status]??9)).map(d=>{const e=efetivo(d);
      return `<li><span><b>${esc(d.nome)}</b> · <span class="muted">${esc(d.area)}</span></span><span class="pill" style="--p:var(${STATUS_COR[e]||"--gray"})">${e}</span>
      <span class="o num">${d.os?esc(d.os)+" · ":""}${d.nfe?esc(d.nfe)+" · ":""}Orçado ${faixaR(d.pMin,d.pMax)} · Realizado ${brl(d.real)}${d.obs?` · ${esc(d.obs)}`:""}</span></li>`}).join("")}</ul></details>`:"";
    const bVar=varPrev==null?`<span class="badge neu">1ª safra registrada</span>`:`<span class="badge ${varPrev>0?"up":"down"}">${varPrev>0?"+":""}${varPrev.toFixed(0)}% vs ${ant.s}</span>`;
    const bDes=desvio==null?"":`<span class="badge ${desvio>0?"up":"down"}">${desvio>0?"+":""}${desvio.toFixed(1)}% desvio</span>`;
    return `<div class="hrow ${v.s===st.safra?"sel":""}">
      <div class="ano">${v.s}<small>${fase}</small></div>
      <div>
        <div class="bullet" role="img" aria-label="Safra ${v.s}: previsto ${brl(v.p)}, realizado ${brl(v.r)}">
          <span class="prev" style="width:${v.p/mx*100}%"></span>
          ${v.r?`<span class="real ${v.r>v.p?"acima":""}" style="width:${v.r/mx*100}%"></span>`:""}
        </div>
        <div class="hnums"><span>Previsto <b>${mil(v.p)}</b></span><span>Realizado <b>${v.r?mil(v.r):"—"}</b></span><span>Execução <b>${exec.toFixed(0)}%</b></span><span>Atividades <b>${v.c}/${v.n}</b></span>${bVar}${bDes}</div>
        ${lista}
      </div></div>`}).join("");
}

function tabela(L){
  const K=kpiDe(st.kpi);
  const todas=L.filter(K.f);
  const ordP={"Crítica":0,"Alta":1,"Média":2,"Baixa":3};
  const ord=(a,b)=>(aberta(a)?0:1)-(aberta(b)?0:1)||(ordP[a.prioridade]??9)-(ordP[b.prioridade]??9)||(a.fim||"").localeCompare(b.fim||"");
  document.getElementById("ttab").textContent=(st.kpi==="todas"?"Atividades":K.l)+` · ${todas.length}`;
  document.getElementById("filtros").innerHTML=
    `<span class="chip on">${K.l}${st.kpi!=="todas"?` <span data-limpa="kpi" role="button" tabindex="0" aria-label="Remover filtro ${K.l}">✕</span>`:""}</span>`+
    (st.tipo?`<span class="chip on">${esc(st.tipo)} <span data-limpa="tipo" role="button" tabindex="0" aria-label="Remover filtro ${esc(st.tipo)}">✕</span></span>`:"")+
    `<span class="sub">Safra ${st.safra}</span>`;
  const linha=d=>{const e=efetivo(d);const pc=d.prioridade==="Crítica"?"crit":d.prioridade==="Alta"?"alta":"";
    const docs=[d.os?`<span class="doc">OS ${esc(d.os.replace(/^OS-?/,""))}</span>`:"",d.nfe?`<span class="doc nf">${esc(d.nfe)}</span>`:"",
      (d.fotos||[]).length?`<span class="doc ft" title="Fotos do local">${ico.foto}${d.fotos.length}</span>`:"",
      (d.orcamentos||[]).length?`<span class="doc oc" title="Orçamentos anexados">${ico.clip}${d.orcamentos.length}</span>`:"",
      (d.materiais||[]).length?`<span class="doc mt" title="Materiais listados">${ico.caixa}${d.materiais.length}</span>`:""].join("");
    return `<tr id="a${d.id}" class="${pc?"pri-"+pc:""} abre" data-abre="${d.id}" tabindex="0">
    <td><b>${esc(d.nome)}</b><div class="muted"><span class="pri-t ${pc==="crit"?"c":pc==="alta"?"a":""}">${esc(d.prioridade)}</span></div></td>
    <td>${esc(d.area)}</td><td>${esc(d.tipo)}</td>
    <td class="num">${dt(d.fim)}<div class="muted">início ${dt(d.ini)}</div></td>
    <td><span class="pill" style="--p:var(${STATUS_COR[e]||"--gray"})">${e}</span></td>
    <td>${esc(d.compra)}</td>
    <td><div class="docs">${docs||'<span class="muted">—</span>'}</div></td>
    <td class="r">${celOrc(d)}</td><td class="r num">${brl(d.real)}</td></tr>`};
  document.getElementById("grupos").innerHTML=Object.entries(DEPTS).filter(([n])=>!st.dept||n===st.dept).map(([n,c])=>{
    const D=L.filter(d=>d.dept===n), rows=todas.filter(d=>d.dept===n).sort(ord);
    const cc=D.filter(d=>d.status==="Concluído").length;
    return `<div class="grupo ${rows.length?"":"vazio-g"}" id="${gid(n)}" style="--c:var(${c})">
      <div class="grupo-h"><h3>${n}<small>${rows.length} de ${D.length} atividades</small></h3>
        <div class="tot"><span>Concluídas <b>${cc}/${D.length}</b></span><span>Orçado <b>${faixaR(sMin(D),sMax(D))}</b></span><span>Realizado <b>${brl(sum(D,d=>d.real))}</b></span></div></div>
      ${rows.length?"":`<div class="sem">Nenhuma atividade de ${n} neste filtro.</div>`}
      <div class="tbl"><table>
        <thead><tr><th>Atividade</th><th>Equipamento / Área</th><th>Tipo</th><th>Prazo</th><th>Status</th><th>Compra</th><th>OS · NF-e · Anexos</th><th class="r">Previsto</th><th class="r">Realizado</th></tr></thead>
        <tbody>${rows.map(linha).join("")}</tbody></table></div></div>`}).join("");
  if(st.foco){const tr=document.getElementById("a"+st.foco);if(tr){tr.classList.add("flash");tr.scrollIntoView({behavior:"smooth",block:"center"})}st.foco=null}
}

let ultimoFoco=null;
function abrir(id){
  const d=DADOS.find(x=>String(x.id)===String(id)); if(!d) return;
  const e=efetivo(d), g=document.getElementById("gaveta");
  g.style.setProperty("--c",`var(${DEPTS[d.dept]})`);
  document.getElementById("gv-dep").textContent=`${d.dept} · Safra ${d.safra}`;
  document.getElementById("gv-tit").textContent=d.nome;
  const campo=(l,v,mono)=>`<div class="gv-campo ${v?"":"vazio"}"><div class="l">${l}</div><div class="v ${mono?"num":""}">${v||"Não informado"}</div></div>`;
  const arq=a=>a.url&&a.url!=="#"?`<li><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${ico.doc}${esc(a.nome)}</a></li>`:`<li><span class="a">${ico.doc}${esc(a.nome)}</span></li>`;
  const fotos=d.fotos||[], orc=d.orcamentos||[];
  document.getElementById("gv-corpo").innerHTML=`
    <div class="gv-grade">
      ${campo("Status",`<span class="pill" style="--p:var(${STATUS_COR[e]||"--gray"})">${e}</span>`)}
      ${campo("Prioridade",esc(d.prioridade))}
      ${campo("Nº Ordem de Serviço",esc(d.os),1)}
      ${campo("Nº NF-e",esc(d.nfe),1)}
      ${campo("Equipamento / Área",esc(d.area))}
      ${(d.bombas||[]).length?`<div class="gv-campo" style="grid-column:1/-1"><div class="l">Bomba(s) Netzsch</div><div class="v">${d.bombas.map(esc).join("<br>")}</div></div>`:""}
      ${campo("Tipo",esc(d.tipo))}
      ${campo("Prazo",d.ini?`${dt(d.ini)} → ${dt(d.fim)}`:"",1)}
      ${campo("Status da compra",esc(d.compra))}
      ${campo(d.orcTipo==="materiais"?`Orçado (soma de ${d.orcN} de ${d.matN} itens)`:d.orcTipo==="cotado"?"Orçado (faixa das cotações)":d.orcTipo==="aprovado"?"Orçado (cotação aprovada)":"Previsto",d.orcTipo?faixaR(d.pMin,d.pMax):"",1)}
      ${campo("Realizado",d.real!=null?brl(d.real):"",1)}
    </div>
    <div class="gv-sec"><h3>${ico.foto} Fotos do local</h3>${fotos.length?`<div class="fotos">${fotos.map((f,i)=>`<figure><button type="button" class="foto-btn" data-zoom="${i}" aria-label="Ampliar foto ${esc(f.nome)}"><img src="${esc(f.url)}" alt="${esc(f.nome)}" loading="lazy"></button><figcaption>${esc(f.nome)}</figcaption></figure>`).join("")}</div>`:`<div class="sem-arq">Nenhuma foto anexada no Monday.</div>`}</div>
    <div class="gv-sec"><h3>${ico.clip} Orçamentos</h3>${orc.length?`<ul class="arqs">${orc.map(arq).join("")}</ul>`:`<div class="sem-arq">Nenhum orçamento anexado.</div>`}</div>
    <div class="gv-sec"><h3>${ico.doc} NF-e</h3>${d.nfeArq?`<ul class="arqs">${arq(d.nfeArq)}</ul>`:`<div class="sem-arq">${d.nfe?"Número informado, arquivo não anexado.":"Sem nota fiscal vinculada."}</div>`}</div>
    ${cotacoesHTML(d)}
    <div class="gv-sec"><h3>${ico.caixa} Materiais</h3>${(d.materiais||[]).length?`<div class="mat-wrap"><table class="mat"><thead><tr><th>Código</th><th>Descrição</th><th class="r">Qtd.</th><th class="r">Valor unit.</th><th class="r">Valor total</th><th>Fornecedor</th><th>Situação</th></tr></thead><tbody>${d.materiais.map(m=>`<tr${m.vtot>0?"":' class="sem-preco"'}><td class="num">${esc(m.cod)||"—"}</td><td>${esc(m.desc)}</td><td class="r num">${m.qtd!=null?m.qtd.toLocaleString("pt-BR"):"—"} ${esc(m.un)}</td><td class="r num">${m.vunit>0?brl(m.vunit):"—"}</td><td class="r num">${m.vtot>0?brl(m.vtot):'<span class="falta">Aguardando cotação</span>'}</td><td>${m.forn?esc(m.forn)+(m.prop?` <small>· ${esc(m.prop)}</small>`:""):"—"}</td><td>${m.sit?`<span class="mat-sit" data-s="${esc(m.sit)}">${esc(m.sit)}</span>`:"—"}</td></tr>`).join("")}</tbody>${d.materiais.some(m=>m.vtot>0)?`<tfoot><tr><td colspan="4">Total orçado · ${d.materiais.filter(m=>m.vtot>0).length} de ${d.materiais.length} itens</td><td class="r num">${brl(sum(d.materiais,m=>m.vtot||0))}</td><td colspan="2"></td></tr></tfoot>`:""}</table></div>`:`<div class="sem-arq">Nenhum material listado no Monday.</div>`}</div>
    ${d.obs?`<div class="gv-sec"><h3>Observações / lições aprendidas</h3><p style="margin:0">${esc(d.obs)}</p></div>`:""}
    ${d.url?`<a class="btn-monday" href="${esc(d.url)}" target="_blank" rel="noopener noreferrer">Abrir no Monday</a>`:""}`;
  fotosAbertas=fotos;
  ultimoFoco=document.activeElement;
  document.getElementById("fundo").hidden=false; g.hidden=false;
  document.getElementById("gv-fechar").focus();
}
/* ---------- Foto ampliada ---------- */
let fotosAbertas=[],fotoAtual=0;
function mostrarFoto(i){
  const n=fotosAbertas.length;if(!n)return;
  fotoAtual=(i+n)%n;const f=fotosAbertas[fotoAtual];
  const img=document.getElementById("fzImg");img.src=f.url;img.alt=f.nome||"Foto do local";
  document.getElementById("fzLeg").textContent=(f.nome||"")+(n>1?`  ·  ${fotoAtual+1} de ${n}`:"");
  document.getElementById("fzAnt").hidden=document.getElementById("fzProx").hidden=n<2;
  const z=document.getElementById("fotoZoom");z.hidden=false;document.getElementById("fzFechar").focus();
}
function fecharFoto(){document.getElementById("fotoZoom").hidden=true;const b=document.querySelector(`[data-zoom="${fotoAtual}"]`);if(b)b.focus()}
document.getElementById("fzFechar").addEventListener("click",fecharFoto);
document.getElementById("fzAnt").addEventListener("click",()=>mostrarFoto(fotoAtual-1));
document.getElementById("fzProx").addEventListener("click",()=>mostrarFoto(fotoAtual+1));
document.getElementById("fotoZoom").addEventListener("click",e=>{if(e.target.id==="fotoZoom"||e.target.tagName==="FIGURE")fecharFoto()});
document.addEventListener("click",e=>{const b=e.target.closest("[data-zoom]");if(b)mostrarFoto(+b.dataset.zoom)});
/* ---------- Largura ajustável da gaveta ---------- */
(function(){
  const g=document.getElementById("gaveta"),alca=document.getElementById("gvAlca"),CH="safraTomate.larguraGaveta";
  const MIN=380, max=()=>Math.max(MIN,window.innerWidth-260);
  const aplicar=w=>{w=Math.round(Math.min(max(),Math.max(MIN,w)));g.style.setProperty("--gv-w",w+"px");return w};
  let salva=null;try{salva=+localStorage.getItem(CH)||null}catch(e){}
  if(salva)aplicar(salva);
  const guardar=w=>{try{localStorage.setItem(CH,String(w))}catch(e){}};
  let ini=null;
  alca.addEventListener("pointerdown",e=>{e.preventDefault();ini={x:e.clientX,w:g.getBoundingClientRect().width};g.classList.add("arrastando");alca.setPointerCapture(e.pointerId)});
  alca.addEventListener("pointermove",e=>{if(ini)aplicar(ini.w+(ini.x-e.clientX))});
  const soltar=()=>{if(!ini)return;ini=null;g.classList.remove("arrastando");guardar(g.getBoundingClientRect().width)};
  alca.addEventListener("pointerup",soltar);alca.addEventListener("pointercancel",soltar);
  alca.addEventListener("dblclick",()=>guardar(aplicar(520)));
  alca.addEventListener("keydown",e=>{const w=g.getBoundingClientRect().width;if(e.key==="ArrowLeft"){e.preventDefault();guardar(aplicar(w+40))}else if(e.key==="ArrowRight"){e.preventDefault();guardar(aplicar(w-40))}});
  document.getElementById("gv-expandir").addEventListener("click",()=>{const w=g.getBoundingClientRect().width;guardar(aplicar(w<max()-20?max():520))});
  window.addEventListener("resize",()=>{const w=parseFloat(getComputedStyle(g).getPropertyValue("--gv-w"));if(w)aplicar(w)});
})();
function fechar(){document.getElementById("fundo").hidden=true;document.getElementById("gaveta").hidden=true;if(ultimoFoco&&ultimoFoco.focus)ultimoFoco.focus()}
document.getElementById("gv-fechar").addEventListener("click",fechar);
document.getElementById("fundo").addEventListener("click",fechar);
document.addEventListener("keydown",e=>{
  const z=document.getElementById("fotoZoom");
  if(!z.hidden){if(e.key==="Escape")fecharFoto();else if(e.key==="ArrowLeft")mostrarFoto(fotoAtual-1);else if(e.key==="ArrowRight")mostrarFoto(fotoAtual+1);return}
  if(e.key==="Escape"&&!document.getElementById("gaveta").hidden)fechar();
  const tr=e.target.closest&&e.target.closest("tr[data-abre]");
  if(tr&&(e.key==="Enter"||e.key===" ")){e.preventDefault();abrir(tr.dataset.abre)}
});
document.addEventListener("click",e=>{const tr=e.target.closest("[data-abre]");if(tr)abrir(tr.dataset.abre)});
const slug=s=>s.normalize("NFD").replace(/[\u0300-\u036f]/g,"").toLowerCase();
// qual: "safra" (visão geral), "hist" (histórico) ou o nome de um departamento
function aba(qual){
  const dep=DEPTS[qual]?qual:null, painel=qual==="hist"||qual==="mat"?qual:"safra";
  st.dept=dep;st.kpi="todas";
  ["safra","hist","mat"].forEach(a=>document.getElementById("aba-"+a).hidden=a!==painel);
  ["safra","hist","mat"].forEach(a=>document.getElementById("tab-"+a).setAttribute("aria-current",qual===a?"page":"false"));
  document.querySelectorAll("[data-nav]").forEach(b=>b.setAttribute("aria-current",b.dataset.nav===dep?"page":"false"));
  document.getElementById("crumbAba").textContent=qual==="hist"?"Histórico":qual==="mat"?"Materiais e valores":dep||"Visão geral";
  document.getElementById("pgTitulo").textContent=qual==="hist"?"Histórico entre safras":qual==="mat"?"Materiais e valores orçados":dep?`Atividades de ${dep}`:"Preparação da Safra de Tomate";
  fecharMenu();
  if(st.safra)render();
  window.scrollTo({top:0,behavior:"smooth"});
  try{history.replaceState(null,"","#"+(qual==="hist"?"historico":qual==="mat"?"materiais":dep?slug(dep):"geral"))}catch(e){}
}
/* ---------- Materiais e valores: cada item com seu preço e o que falta cotar ---------- */
function materiaisTela(LS){
  const comMat=LS.filter(d=>(d.materiais||[]).length);
  const cotA=d=>d.orcTipo==="cotado"||d.orcTipo==="aprovado";
  const todos=comMat.flatMap(d=>d.materiais.map(m=>({...m,_a:d})));
  const tem=m=>m.vtot>0, emC=(m,d)=>!tem(m)&&cotA(d), falta=(m,d)=>!tem(m)&&!cotA(d);
  const nP=todos.filter(tem).length, nC=todos.filter(m=>emC(m,m._a)).length, nF=todos.length-nP-nC, tot=sum(todos,m=>m.vtot||0);
  const atC=comMat.filter(cotA), cMin=sum(atC,d=>d.pMin), cMax=sum(atC,d=>d.pMax);
  const ativOk=comMat.filter(d=>!d.materiais.some(m=>falta(m,d))).length;
  const n=todos.length||1;
  const card=(id,l,v,dd,k,frac)=>`<button type="button" class="kpi" style="--k:var(${k})" data-mf="${id}" aria-pressed="${st.mf===id}"><span class="l">${l}</span><span class="v num">${v}</span><span class="d">${dd}</span>${frac!=null?`<span class="mini"><span style="width:${Math.round(frac*100)}%"></span></span>`:""}</button>`;
  document.getElementById("matKpis").innerHTML=
    card("todos","Itens de material",todos.length,`em ${comMat.length} atividades · ${ativOk} sem pendência`,"--brand",null)+
    card("preco","Com preço por item",nP,`${brl(tot)}`,"--ok",nP/n)+
    card("cot","Em cotação de fornecedores",nC,atC.length?`${atC.length} atividades · ${faixaR(cMin,cMax)}`:"—","--ele",nC/n)+
    card("falta","Faltando cotação",nF,`${Math.round(nF/n*100)}% dos itens`,"--warn",nF/n)+
    `<div class="kpi tot" style="--k:var(--gold);cursor:default"><span class="l">Total orçado até agora</span><span class="v num">${brl(tot+cMin)}</span><span class="d">${cMax>cMin?`até ${brl(tot+cMax)} · `:""}itens com preço + cotações (menor–maior)</span></div>`;
  const deps=Object.keys(DEPTS).filter(n=>comMat.some(d=>d.dept===n));
  const nomes={todos:"Todos os itens",preco:"Com preço",cot:"Em cotação",falta:"Faltando cotação"};
  document.getElementById("matFiltros").innerHTML=
    Object.entries(nomes).map(([k,l])=>`<button type="button" class="chip${st.mf===k?" on":""}" data-mf="${k}" aria-pressed="${st.mf===k}">${l}</button>`).join("")+
    (deps.length>1?deps.map(n=>`<button type="button" class="chip${st.md===n?" on":""}" data-md="${esc(n)}" aria-pressed="${st.md===n}"><span class="dot" style="--c:var(${DEPTS[n]})"></span>${esc(n)}</button>`).join(""):"");
  const filtroM=st.mf==="preco"?(m=>tem(m)):st.mf==="cot"?emC:st.mf==="falta"?falta:()=>true;
  const pend=d=>d.materiais.filter(m=>falta(m,d)).length/d.materiais.length;
  const grupos=comMat.filter(d=>!st.md||d.dept===st.md).map(d=>({d,ms:d.materiais.filter(m=>filtroM(m,d))})).filter(g=>g.ms.length)
    .sort((a,b)=>pend(b.d)-pend(a.d)||b.d.materiais.length-a.d.materiais.length);
  document.getElementById("matTit").textContent=`${nomes[st.mf]} · ${grupos.reduce((a,g)=>a+g.ms.length,0)}`;
  const el=document.getElementById("matGrupos");
  if(!grupos.length){el.innerHTML=`<div class="sem-arq">${st.mf==="falta"?"Nenhum item faltando cotação.":"Nenhum material nesta seleção."}</div>`;return}
  el.innerHTML=grupos.map(({d,ms})=>{
    const M=d.materiais, p=M.filter(tem).length, f=M.filter(m=>falta(m,d)).length, t=sum(M,m=>m.vtot||0), c=cotA(d);
    const selo=f===0?(c&&!p?`<span class="mat-st cot">Em cotação · ${d.orcN} proposta${d.orcN>1?"s":""}</span>`:`<span class="mat-st ok">Completo</span>`):`<span class="mat-st ${p?"parc":"zero"}">Faltam ${f} de ${M.length}</span>`;
    const tt=c&&!p?`Faixa <b>${faixaR(d.pMin,d.pMax)}</b>`:`Total <b>${t?brl(t):"—"}</b>`;
    const val=m=>tem(m)?brl(m.vtot):c?`<span class="emcot">Na cotação</span>`:'<span class="falta">Aguardando cotação</span>';
    return `<div class="grupo mat-g" style="--c:var(${DEPTS[d.dept]||"--brand"})">
      <div class="grupo-h"><h3><button type="button" class="lnk" data-abre="${esc(d.id)}" title="Abrir detalhes da atividade">${esc(d.nome)}</button><small>${esc(d.dept)}</small></h3>
        <div class="tot">${selo}<span>${p} de ${M.length} com preço</span><span>${tt}</span></div></div>
      <div class="tbl"><table class="mat"><thead><tr><th>Código</th><th>Descrição</th><th class="r">Qtd.</th><th class="r">Valor unit.</th><th class="r">Valor total</th><th>Fornecedor</th></tr></thead><tbody>
      ${ms.map(m=>`<tr${tem(m)?"":' class="sem-preco"'}><td class="num">${esc(m.cod)||"—"}</td><td>${esc(m.desc)}</td><td class="r num">${m.qtd!=null?m.qtd.toLocaleString("pt-BR"):"—"} ${esc(m.un)}</td><td class="r num">${m.vunit>0?brl(m.vunit):"—"}</td><td class="r num">${val(m)}</td><td>${m.forn?esc(m.forn)+(m.prop?` <small>· ${esc(m.prop)}</small>`:""):c&&!tem(m)?`<small>ver ${d.orcN} cotaç${d.orcN>1?"ões":"ão"}</small>`:"—"}</td></tr>`).join("")}
      </tbody></table></div></div>`}).join("");
}
function fecharMenu(){document.getElementById("side").classList.remove("open");document.querySelector(".scrim")?.remove()}
document.getElementById("menuBtn").addEventListener("click",()=>{const s=document.getElementById("side");s.classList.add("open");const sc=document.createElement("div");sc.className="scrim";sc.onclick=fecharMenu;document.body.appendChild(sc)});
function irLista(){document.getElementById("atividades").scrollIntoView({behavior:"smooth",block:"start"})}
document.addEventListener("click",e=>{
  const lim=e.target.closest("[data-limpa]"); if(lim){const k=lim.dataset.limpa;st[k]=k==="kpi"?"todas":k==="tipo"?"":null;render();return}
  const ct=e.target.closest("[data-tipo]"); if(ct){st.tipo=st.tipo===ct.dataset.tipo?"":ct.dataset.tipo;render();return}
  const b=e.target.closest("button"); if(!b) return;
  if(b.dataset.aba){aba(b.dataset.aba);return}
  if(b.dataset.mf){st.mf=b.dataset.mf;materiaisTela(DADOS.filter(d=>d.safra===st.safra));return}
  if(b.dataset.md!==undefined){st.md=st.md===b.dataset.md?"":b.dataset.md;materiaisTela(DADOS.filter(d=>d.safra===st.safra));return}
  if(b.dataset.d){aba(b.dataset.d);return}
  if(b.dataset.s){st.safra=b.dataset.s;st.kpi="todas";render()}
  else if(b.dataset.kpi){st.kpi=st.kpi===b.dataset.kpi?"todas":b.dataset.kpi;render();if(st.kpi!=="todas")irLista()}
  else if(b.dataset.foco){if(!document.getElementById("aba-safra").hidden){st.kpi="todas"}else{aba("safra")}st.foco=b.dataset.foco;render()}
});
document.addEventListener("keydown",e=>{if((e.key==="Enter"||e.key===" ")&&e.target.dataset&&e.target.dataset.limpa){e.preventDefault();e.target.click()}});

function iniciar(){const s=safras(),ano=String(new Date().getFullYear()+1);st.safra=s.includes(ano)?ano:s[s.length-1];const h=location.hash.slice(1),dep=Object.keys(DEPTS).find(n=>slug(n)===h);aba(h==="historico"?"hist":h==="materiais"?"mat":dep||"safra")}
/* ---------- Carregamento dos dados ----------
   A automação (GitHub Actions) lê o quadro do Monday e publica data/dados.json.
   Sem esse arquivo (antes da primeira execução), o painel mostra os exemplos. */
const ARQ_DADOS="data/dados.json";
async function carregar(){
  let r=null;
  try{r=await fetch(ARQ_DADOS,{cache:"no-store"})}catch(e){}
  if(r&&r.ok){
    try{
      const dados=await r.json();
      DADOS=prep(Array.isArray(dados.itens)?dados.itens:[]);
      const quando=dados.gerado?new Date(dados.gerado).toLocaleString("pt-BR",{day:"2-digit",month:"2-digit",year:"numeric",hour:"2-digit",minute:"2-digit"}):"";
      document.getElementById("fonteSub").textContent="Atualizado em "+quando;
      document.getElementById("rodapeFonte").textContent=`Fonte: quadro “Safra de Tomate – Preparação e Investimentos” (Monday) · atualizado em ${quando}.`;
      iniciar();return;
    }catch(e){}
  }
  DADOS=prep(EXEMPLO);
  document.getElementById("fonteSub").textContent="Dados de exemplo (automação ainda não rodou)";
  document.getElementById("rodapeFonte").textContent="Exibindo dados de EXEMPLO. Os dados reais aparecem depois da primeira execução da automação.";
  iniciar();
}
carregar();
