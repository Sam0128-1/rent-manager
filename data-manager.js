(function(){
  "use strict";
  var CKEY="supabase_config";
  function loadCfg(){try{var r=localStorage.getItem(CKEY);return r?JSON.parse(r):{url:"",key:"",autoSync:false};}catch(e){return{url:"",key:"",autoSync:false};}}
  function saveCfg(c){localStorage.setItem(CKEY,JSON.stringify(c));}
  var cfg=loadCfg(),sbClient=null,ready=false;
  function initSB(){if(!cfg.url||!cfg.key){ready=false;return false;}if(typeof window.supabase==="undefined"){ready=false;return false;}try{sbClient=window.supabase.createClient(cfg.url,cfg.key);ready=true;return true;}catch(e){ready=false;return false;}}
  function lastSync(){return parseInt(localStorage.getItem(STORAGE_KEY+"_lastCloudSync")||"0");}
  function setSync(){localStorage.setItem(STORAGE_KEY+"_lastCloudSync",Date.now().toString());}
  async function upload(){if(!ready){toast("请先配置云同步");return;}try{var j=JSON.stringify(state);var r=await sbClient.from("rent_data").upsert({id:1,data:j,updated_at:new Date().toISOString()});if(r.error)throw r.error;setSync();toast("已同步到云端");updUI();}catch(e){toast("同步失败: "+(e.message||e));}}
  async function download(){if(!ready){toast("请先配置云同步");return;}try{var r=await sbClient.from("rent_data").select("data,updated_at").eq("id",1).single();if(r.error)throw r.error;if(!r.data||!r.data.data){toast("云端暂无数据");return;}var cs=JSON.parse(r.data.data);if(!cs.rooms){toast("数据格式错误");return;}var t=new Date(r.data.updated_at).toLocaleString("zh-CN");if(!confirm("云端更新于: "+t+"\n\n用云端数据覆盖本地吗?\n(建议先导出备份)"))return;state=cs;initRooms();save();renderAll();toast("已从云端恢复");}catch(e){toast("下载失败: "+(e.message||e));}}
  var _os=null,_st=null;
  function hookSave(){if(typeof window.save!=="function"||_os)return;_os=window.save;window.save=function(){_os.apply(this,arguments);if(ready&&cfg.autoSync){clearTimeout(_st);_st=setTimeout(function(){upload().catch(function(){});},3000);}};}
  function updUI(){var s=document.getElementById("cloudSyncSection");if(!s)return;var t=lastSync();var ts=t?new Date(t).toLocaleString("zh-CN"):"从未同步";var e=s.querySelector("[data-lastsync]");if(e)e.textContent=ts;}
  function inject(){
    var sb=document.getElementById("settingsBody");if(!sb)return;if(document.getElementById("cloudSyncSection"))return;
    var ok=cfg.url&&cfg.key;var ls=lastSync();var lst=ls?new Date(ls).toLocaleString("zh-CN"):"从未同步";
    var sec=document.createElement("div");sec.className="section";sec.id="cloudSyncSection";
    sec.innerHTML='<div class="section-title">☁️ 云端同步 (Supabase)</div>'+
    '<div class="fee-calc">'+
      '<div class="fee-calc-row"><span class="fc-label">同步状态</span><span class="fc-value" style="color:'+(ok?'var(--success)':'var(--text-lighter)')+'">'+(ok?'已配置':'未配置')+'</span></div>'+
      '<div class="fee-calc-row"><span class="fc-label">上次同步</span><span class="fc-value" data-lastsync>'+lst+'</span></div>'+
      '<div class="fee-calc-row"><span class="fc-label">自动同步</span><span class="fc-value">'+(cfg.autoSync?'已开启':'未开启')+'</span></div>'+
    '</div>'+(ok?'':'<div class="info-hint" style="color:var(--warning)">⚠️ 请配置 Supabase</div>')+
    '<div class="switch-row" style="margin-top:10px"><span class="switch-label">自动同步到云端</span><div class="switch '+(cfg.autoSync?'on':'')+'" id="swAuto"></div></div>'+
    '<div class="btn-group"><button class="btn btn-primary" id="btnUp" '+(ok?'':'disabled style="opacity:.5"')+'>⬆️ 上传到云端</button><button class="btn btn-secondary" id="btnDown" '+(ok?'':'disabled style="opacity:.5"')+'>⬇️ 从云端恢复</button></div>'+
    '<button class="btn btn-secondary btn-full" id="btnCfg" style="margin-top:8px;background:var(--purple-bg);color:var(--purple)">⚙️ 配置 Supabase</button>'+
    '<div class="info-hint">云端同步可实现多设备数据共享</div>';
    var secs=sb.querySelectorAll(".section");if(secs.length>0){sb.insertBefore(sec,secs[secs.length-1]);}else{sb.appendChild(sec);}
    document.getElementById("swAuto").addEventListener("click",function(){cfg.autoSync=!cfg.autoSync;saveCfg(cfg);this.classList.toggle("on");var e=sec.querySelectorAll(".fc-value")[2];if(e)e.textContent=cfg.autoSync?"已开启":"未开启";toast(cfg.autoSync?"已开启自动同步":"已关闭自动同步");});
    document.getElementById("btnUp").addEventListener("click",upload);
    document.getElementById("btnDown").addEventListener("click",download);
    document.getElementById("btnCfg").addEventListener("click",cfgDlg);
  }
  function cfgDlg(){
    var o=document.getElementById("overlay"),s=document.getElementById("sheet"),t=document.getElementById("sheetTitle"),b=document.getElementById("sheetBody");
    t.textContent="☁️ 配置 Supabase";
    b.innerHTML='<div class="section"><div class="section-title">连接配置</div>'+
      '<div class="form-row"><label>Project URL</label><input type="text" id="cfgUrl" placeholder="https://xxxx.supabase.co" value="'+(cfg.url||'')+'"></div>'+
      '<div class="form-row"><label>Anon Public Key</label><textarea id="cfgKey" placeholder="eyJhbGciOiJIUzI1NiIs..." style="min-height:72px;font-size:12px">'+(cfg.key||'')+'</textarea></div>'+
      '<div class="info-hint">获取: supabase.com → 项目 → Settings → API Keys + Data API</div>'+
      '<div class="info-hint" style="color:var(--danger);margin-top:6px">⚠️ 需先执行 supabase-setup.sql</div></div>'+
      '<div class="section"><div class="section-title">说明</div>'+
      '<div class="info-hint" style="line-height:1.8">• 上传: 推送数据到云端<br>• 恢复: 从云端拉取数据<br>• 自动同步: 修改后自动上传</div></div>'+
      '<div class="btn-group"><button class="btn btn-primary" id="btnSaveC">保存</button><button class="btn btn-danger" id="btnClrC" style="flex:0 0 auto;padding:12px 16px">清除</button></div>';
    o.classList.add("show");s.classList.add("show");
    document.getElementById("btnSaveC").addEventListener("click",function(){var u=document.getElementById("cfgUrl").value.trim();var k=document.getElementById("cfgKey").value.trim();if(!u||!k){toast("请填写完整");return;}cfg.url=u;cfg.key=k;saveCfg(cfg);initSB();o.classList.remove("show");s.classList.remove("show");toast("配置已启用");if(typeof openSettings==="function")openSettings();});
    document.getElementById("btnClrC").addEventListener("click",function(){if(!confirm("确定清除?"))return;cfg={url:"",key:"",autoSync:false};saveCfg(cfg);ready=false;sbClient=null;o.classList.remove("show");s.classList.remove("show");toast("已清除");if(typeof openSettings==="function")openSettings();});
  }
  function watchSB(){var sb=document.getElementById("settingsBody");if(!sb)return;var ob=new MutationObserver(function(){if(sb.children.length>0&&!document.getElementById("cloudSyncSection"))inject();});ob.observe(sb,{childList:true,subtree:true});}
  if(document.readyState==="loading"){document.addEventListener("DOMContentLoaded",function(){initSB();hookSave();watchSB();});}else{initSB();hookSave();watchSB();}
  window.CloudSync={upload:upload,download:download,isReady:function(){return ready;}};
})();