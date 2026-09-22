const colors={relic:"#f2bd4d",viewpoint:"#9b72ff",balloon:"#55c7ff",activity:"#5bd59a",quest:"#ff6e88"};
const labels={relic:"Reliques",viewpoint:"Points de vue",balloon:"Ballons RR",activity:"Activités",quest:"Quêtes"};
const icons={relic:"◆",viewpoint:"◉",balloon:"●",activity:"▲",quest:"!"};
let data=[], active={relic:true,viewpoint:true,balloon:true,activity:true,quest:true}, done=JSON.parse(localStorage.rrDone||"{}"), markers=[];

const map=L.map("map",{zoomControl:true,minZoom:2,maxZoom:19}).setView([39.7,-110.5],5);
const osm=L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png",{maxZoom:19,attribution:'&copy; OpenStreetMap contributors'}).addTo(map);

fetch("data/locations.json").then(r=>r.json()).then(d=>{data=d; buildFilters(); render();});

function project(p){return [37 + (50-p.y)*.10, -123 + p.x*.19]}
function markerIcon(item){return L.divIcon({className:"",html:`<div class="pin" style="background:${colors[item.type]}">${icons[item.type]}</div>`,iconSize:[29,29],iconAnchor:[14,14],popupAnchor:[0,-13]})}
function render(){
  markers.forEach(m=>map.removeLayer(m));markers=[];
  const q=document.querySelector("#search").value.trim().toLowerCase();
  const visible=data.filter(i=>active[i.type]&&( !q || `${i.name} ${i.region} ${i.desc}`.toLowerCase().includes(q)));
  visible.forEach(i=>{
    const m=L.marker(project(i),{icon:markerIcon(i)}).bindPopup(`
      <div class="popup"><h3>${esc(i.name)}</h3><div class="type">${labels[i.type]||i.type} · ${esc(i.region)}</div>
      <p>${esc(i.desc)}</p><button class="done ${done[i.id]?"is-done":""}" onclick="toggleDone('${i.id}')">${done[i.id]?"✓ Terminé":"Marquer comme terminé"}</button></div>`);
    m.addTo(map);markers.push(m);
  });
  document.querySelector("#resultText").textContent=`${visible.length} résultat${visible.length>1?"s":""}`;
  updateProgress();
}
function buildFilters(){
 const el=document.querySelector("#filters");el.innerHTML="";
 Object.entries(labels).forEach(([type,label])=>{
   const count=data.filter(x=>x.type===type).length;
   const row=document.createElement("label");row.className="filter";
   row.innerHTML=`<input type="checkbox" checked data-type="${type}"><span class="icon" style="background:${colors[type]}">${icons[type]}</span><span>${label}</span><em>${count}</em>`;
   row.querySelector("input").onchange=e=>{active[type]=e.target.checked;render()};el.appendChild(row);
 });
}
function updateProgress(){
 const total=data.length, n=Object.keys(done).filter(id=>data.some(x=>x.id===id)).length, pct=total?Math.round(n/total*100):0;
 document.querySelector("#progress").textContent=pct+"%";document.querySelector("#bar").style.width=pct+"%";
 document.querySelector("#progressInfo").textContent=`${n} élément${n>1?"s":""} terminé${n>1?"s":""} sur ${total}`;
}
window.toggleDone=id=>{done[id]=!done[id];if(!done[id])delete done[id];localStorage.rrDone=JSON.stringify(done);render()};
function esc(s){return String(s).replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]))}
document.querySelector("#search").oninput=render;
document.querySelector("#clear").onclick=()=>{document.querySelector("#search").value="";render()};
document.querySelector("#home").onclick=()=>map.setView([39.7,-110.5],5);
document.querySelector("#locate").onclick=()=>map.locate({setView:true,maxZoom:14});
document.querySelector("#reset").onclick=()=>{Object.keys(active).forEach(k=>active[k]=true);document.querySelectorAll("#filters input").forEach(x=>x.checked=true);document.querySelector("#search").value="";render()};
document.querySelector("#menu").onclick=()=>document.querySelector("#panel").classList.toggle("open");
document.querySelector("#closePanel").onclick=()=>document.querySelector("#panel").classList.remove("open");
document.querySelectorAll(".quick button").forEach(b=>b.onclick=()=>{
 const p=b.dataset.preset;
 Object.keys(active).forEach(k=>active[k]=p==="all" ? true : p==="collectibles" ? ["relic","viewpoint","balloon"].includes(k) : k==="activity");
 document.querySelectorAll("#filters input").forEach(x=>x.checked=active[x.dataset.type]);document.querySelectorAll(".quick button").forEach(x=>x.classList.remove("active"));b.classList.add("active");render();
});
