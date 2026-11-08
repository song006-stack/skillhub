(function(root){
  const ignored=new Set(['.git','node_modules','.venv','venv','__pycache__']);
  // Read only skill descriptions. All other resources stay in their original folders.
  async function scanDirectory(rootHandle,{maxEntries=20000,maxDepth=12,maxBytes=1024*1024}={}){
    const items=[];let visited=0;
    async function walk(dir,prefix,depth){
      if(depth>maxDepth)throw new Error('目录层级过深，请选择更具体的技能文件夹。');
      for await(const entry of dir.values()){
        if(++visited>maxEntries)throw new Error('目录项目过多，请选择更具体的技能文件夹。');
        const relative=prefix?`${prefix}/${entry.name}`:entry.name;
        if(entry.kind==='directory'){if(!ignored.has(entry.name))await walk(entry,relative,depth+1)}
        else if(entry.kind==='file'&&entry.name.toLowerCase()==='skill.md'){
          const file=await entry.getFile();if(file.size>maxBytes)throw new Error(`${relative} 超过 1 MB，未进行导入。`);
          items.push({path:relative,text:await file.text()});
        }
      }
    }
    await walk(rootHandle,'',0);return items;
  }
  function toRecords(items,source,existing,metadata,makeId){
    const byKey=new Map(existing.map(s=>[s.sourceKey,s]));const excluded=new Set(source.excludedPaths||[]);
    return items.filter(item=>!excluded.has(item.path)).map(item=>{
      const key=`directory:${source.id}:${item.path}`,old=byKey.get(key);
      const files=[{path:item.path,detected:true}];
      return old?{...old,skillText:item.text,files,updatedAt:Date.now()}:
        {...metadata(item.text,item.path),id:makeId(),sourceKey:key,skillText:item.text,files,favorite:false,lastUsed:0,updatedAt:Date.now()};
    });
  }
  const api={scanDirectory,toRecords};root.SkillHubDirectorySync=api;if(typeof module!=='undefined')module.exports=api;
})(globalThis);
