const KEY="md_billing_v1";
let db=JSON.parse(localStorage.getItem(KEY)||"null");
if(!db) db={settings:{name:"Maharashtra Distributors",gstin:"",address:"",phone:""},products:[],customers:[],invoices:[],purchases:[],seq:1};
const save=()=>localStorage.setItem(KEY,JSON.stringify(db));
const money=n=>"₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});
const esc=s=>String(s??"").replace(/[&<>"']/g,m=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[m]));
function showPage(id){document.querySelectorAll(".page").forEach(x=>x.classList.remove("active"));document.getElementById(id).classList.add("active");renderAll();scrollTo(0,0)}
function today(){return new Date().toISOString().slice(0,10)}
function renderAll(){
 document.getElementById("todaySales").textContent=money(db.invoices.filter(x=>x.date===today()).reduce((a,x)=>a+x.total,0));
 document.getElementById("todayCollection").textContent=money(db.invoices.filter(x=>x.date===today()).reduce((a,x)=>a+x.paid,0));
 document.getElementById("outstanding").textContent=money(db.invoices.reduce((a,x)=>a+(x.total-x.paid),0));
 document.getElementById("stockItems").textContent=db.products.reduce((a,x)=>a+Number(x.stock||0),0);
 document.getElementById("recentBills").innerHTML=db.invoices.slice(-5).reverse().map(invoiceHTML).join("");
 document.getElementById("productList").innerHTML=db.products.map((p,i)=>`<div class="item"><strong>${esc(p.name)}</strong><span class="muted">${esc(p.hsn||"No HSN")} • GST ${p.gst}% • Stock ${p.stock}</span><br>Sale: <b>${money(p.sale)}</b> | Purchase: ${money(p.purchase)} <button class="small" style="float:right" onclick="editProduct(${i})">Edit</button></div>`).join("");
 document.getElementById("customerList").innerHTML=db.customers.map((c,i)=>`<div class="item"><strong>${esc(c.name)}</strong><span class="muted">${esc(c.phone||"")} ${c.gstin?"• "+esc(c.gstin):""}</span><br>Outstanding: <b>${money(db.invoices.filter(x=>x.customerId===c.id).reduce((a,x)=>a+x.total-x.paid,0))}</b> <button class="small" style="float:right" onclick="editCustomer(${i})">Edit</button></div>`).join("");
 document.getElementById("invoiceList").innerHTML=db.invoices.slice().reverse().map(invoiceHTML).join("");
 document.getElementById("purchaseList").innerHTML=db.purchases.slice().reverse().map(p=>`<div class="item"><strong>${esc(p.productName)}</strong><span class="muted">${esc(p.date)} • ${esc(p.supplier)}</span><br>${p.qty} × ${money(p.rate)} = <b>${money(p.qty*p.rate)}</b></div>`).join("");
 document.getElementById("businessName").value=db.settings.name;document.getElementById("businessGstin").value=db.settings.gstin;document.getElementById("businessAddress").value=db.settings.address;document.getElementById("businessPhone").value=db.settings.phone;
}
function invoiceHTML(x){return `<div class="item"><strong>${esc(x.number)} — ${esc(x.customerName)}</strong><span class="muted">${esc(x.date)}</span><br><b>${money(x.total)}</b> • Paid ${money(x.paid)} • Balance ${money(x.total-x.paid)} <button class="small" style="float:right" onclick="printInvoice('${x.id}')">Print</button></div>`}
function populate(){
 const c=document.getElementById("billCustomer");c.innerHTML='<option value="">Walk-in / Cash Customer</option>'+db.customers.map(x=>`<option value="${x.id}">${esc(x.name)}</option>`).join("");
 const p=document.getElementById("purchaseProduct");p.innerHTML=db.products.map((x,i)=>`<option value="${i}">${esc(x.name)}</option>`).join("");
}
function newInvoice(){showPage("billing");populate();document.getElementById("billDate").value=today();document.getElementById("billPaid").value=0;document.getElementById("billRows").innerHTML="";addBillRow()}
function addBillRow(){
 const div=document.createElement("div");div.className="row";
 div.innerHTML=`<select class="bprod" onchange="calcBill()"><option value="">Product</option>${db.products.map((p,i)=>`<option value="${i}">${esc(p.name)}</option>`).join("")}</select><input class="bqty" type="number" min="1" value="1" oninput="calcBill()"><input class="brate" type="number" min="0" value="0" oninput="calcBill()"><input class="bgst" type="number" readonly placeholder="GST"><button class="small" onclick="this.parentElement.remove();calcBill()">×</button>`;
 document.getElementById("billRows").appendChild(div)
}
function calcBill(){
 let sub=0,gst=0;
 document.querySelectorAll("#billRows .row").forEach(r=>{let i=r.querySelector(".bprod").value,p=db.products[i];if(p){r.querySelector(".brate").value=p.sale;r.querySelector(".bgst").value=p.gst+"%";let q=+r.querySelector(".bqty").value||0,v=q*p.sale;sub+=v;gst+=v*p.gst/100}});
 document.getElementById("billSubtotal").textContent=money(sub);document.getElementById("billGst").textContent=money(gst);document.getElementById("billTotal").textContent=money(sub+gst);let paid=+document.getElementById("billPaid").value||0;document.getElementById("billBalance").textContent=money(Math.max(0,sub+gst-paid))
}
function saveInvoice(){
 let items=[];document.querySelectorAll("#billRows .row").forEach(r=>{let i=r.querySelector(".bprod").value,p=db.products[i];if(p){let q=+r.querySelector(".bqty").value||0,rate=+r.querySelector(".brate").value||0;items.push({productId:p.id,name:p.name,qty:q,rate,gst:p.gst})}});
 if(!items.length)return alert("Add at least one product.");
 let subtotal=items.reduce((a,x)=>a+x.qty*x.rate,0),gst=items.reduce((a,x)=>a+x.qty*x.rate*x.gst/100,0),total=subtotal+gst,paid=+document.getElementById("billPaid").value||0,cid=document.getElementById("billCustomer").value,c=db.customers.find(x=>x.id===cid);
 items.forEach(x=>{let p=db.products.find(p=>p.id===x.productId);if(p)p.stock=Math.max(0,Number(p.stock)-x.qty)});
 let inv={id:Date.now().toString(),number:"MD-"+String(db.seq++).padStart(4,"0"),date:document.getElementById("billDate").value||today(),customerId:cid,customerName:c?.name||"Cash Customer",items,subtotal,gst,total,paid:Math.min(paid,total)};
 db.invoices.push(inv);save();printInvoice(inv.id)
}
function printInvoice(id){
 let x=db.invoices.find(i=>i.id===id);if(!x)return;
 let rows=x.items.map(i=>`<tr><td>${esc(i.name)}</td><td>${i.qty}</td><td>${money(i.rate)}</td><td>${i.gst}%</td><td>${money(i.qty*i.rate*(1+i.gst/100))}</td></tr>`).join("");
 let w=window.open("","_blank");w.document.write(`<html><head><title>${x.number}</title><style>body{font-family:Arial;padding:25px;color:#111}h1{margin-bottom:2px}table{width:100%;border-collapse:collapse;margin-top:25px}th,td{border:1px solid #ccc;padding:8px;text-align:left}.right{text-align:right}hr{border:0;border-top:1px solid #ccc}</style></head><body><h1>${esc(db.settings.name)}</h1><div>${esc(db.settings.address)}<br>${esc(db.settings.phone)} ${db.settings.gstin?"| GSTIN: "+esc(db.settings.gstin):""}</div><hr><h2>TAX INVOICE</h2><b>Invoice:</b> ${x.number}<br><b>Date:</b> ${x.date}<br><b>Customer:</b> ${esc(x.customerName)}<table><tr><th>Product</th><th>Qty</th><th>Rate</th><th>GST</th><th>Total</th></tr>${rows}</table><h3 class="right">Subtotal: ${money(x.subtotal)}</h3><h3 class="right">GST: ${money(x.gst)}</h3><h2 class="right">Grand Total: ${money(x.total)}</h2><p class="right">Paid: ${money(x.paid)}<br>Balance: ${money(x.total-x.paid)}</p><p>Thank you for your business.</p><script>window.print()<\/script></body></html>`);w.document.close()
}
function openProductForm(idx=null){let p=idx==null?{name:"",hsn:"",gst:18,purchase:0,sale:0,stock:0}:db.products[idx];openModal(`<h2>${idx==null?"Add":"Edit"} Product</h2><label>Name</label><input id="fName" value="${esc(p.name)}"><label>HSN</label><input id="fHsn" value="${esc(p.hsn)}"><div class="formgrid"><div><label>GST %</label><input id="fGst" type="number" value="${p.gst}"></div><div><label>Stock</label><input id="fStock" type="number" value="${p.stock}"></div><div><label>Purchase Rate</label><input id="fPurchase" type="number" value="${p.purchase}"></div><div><label>Sale Rate</label><input id="fSale" type="number" value="${p.sale}"></div></div><button class="primary" style="margin-top:15px;width:100%" onclick="saveProduct(${idx})">Save Product</button>`)}
function saveProduct(idx){let o={id:idx==null?Date.now().toString():db.products[idx].id,name:fName.value,hsn:fHsn.value,gst:+fGst.value||0,stock:+fStock.value||0,purchase:+fPurchase.value||0,sale:+fSale.value||0};if(!o.name)return alert("Product name required");if(idx==null)db.products.push(o);else db.products[idx]=o;save();closeModal();renderAll()}
function editProduct(i){openProductForm(i)}
function openCustomerForm(idx=null){let c=idx==null?{name:"",phone:"",gstin:"",address:""}:db.customers[idx];openModal(`<h2>${idx==null?"Add":"Edit"} Customer</h2><label>Name</label><input id="cName" value="${esc(c.name)}"><label>Phone</label><input id="cPhone" value="${esc(c.phone)}"><label>GSTIN</label><input id="cGstin" value="${esc(c.gstin)}"><label>Address</label><textarea id="cAddress">${esc(c.address)}</textarea><button class="primary" style="margin-top:15px;width:100%" onclick="saveCustomer(${idx})">Save Customer</button>`)}
function saveCustomer(idx){let o={id:idx==null?Date.now().toString():db.customers[idx].id,name:cName.value,phone:cPhone.value,gstin:cGstin.value,address:cAddress.value};if(!o.name)return alert("Customer name required");if(idx==null)db.customers.push(o);else db.customers[idx]=o;save();closeModal();renderAll()}
function editCustomer(i){openCustomerForm(i)}
function savePurchase(){let i=+purchaseProduct.value,p=db.products[i];if(!p)return alert("Add a product first.");let q=+purchaseQty.value||0,r=+purchaseRate.value||0;p.stock=Number(p.stock)+q;db.purchases.push({date:purchaseDate.value||today(),supplier:purchaseSupplier.value||"Supplier",productName:p.name,qty:q,rate:r});save();renderAll();alert("Purchase saved and stock updated.")}
function saveSettings(){db.settings={name:businessName.value||"Maharashtra Distributors",gstin:businessGstin.value,address:businessAddress.value,phone:businessPhone.value};save();alert("Settings saved.");renderAll()}
function openModal(html){document.getElementById("modalContent").innerHTML=html;document.getElementById("modal").classList.add("show")}
function closeModal(){document.getElementById("modal").classList.remove("show")}
function resetData(){if(confirm("Delete all data?")){localStorage.removeItem(KEY);location.reload()}}
document.addEventListener("DOMContentLoaded",()=>{document.getElementById("billDate").value=today();document.getElementById("purchaseDate").value=today();renderAll();populate()})
