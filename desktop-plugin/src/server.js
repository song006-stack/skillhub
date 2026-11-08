import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { registerAppResource, registerAppTool, RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps/server';
import { readFileSync, readdirSync, lstatSync } from 'node:fs';
import { join, basename } from 'node:path';
import { homedir } from 'node:os';

const server = new McpServer({name:'skillhub', version:'0.1.0'});
const resourceUri='ui://skillhub/panel.html';
registerAppResource(server,'skillhub-panel',resourceUri,{},async()=>({contents:[{uri:resourceUri,mimeType:RESOURCE_MIME_TYPE,text:readFileSync(join(__dirname,'panel.html'),'utf8')}]}));
registerAppTool(server,'open_skillhub',{
  title:'SkillHub',description:'Open the local SkillHub library alongside the conversation.',inputSchema:{},
  _meta:{ui:{resourceUri},'openai/ui':{entrypoints:[{type:'thread'},{type:'global'}]}}
},async()=>({content:[{type:'text',text:'SkillHub 已打开。'}]}));
// Only scan the two established user skill roots after an explicit UI action.
// Do not follow symlinks, read related resources, or execute skill scripts.
registerAppTool(server,'scan_local_skills',{
  title:'识别本机技能',description:'Scan the user’s local Codex and agent skill directories on explicit request.',inputSchema:{},
  _meta:{ui:{visibility:['app']}}
},async()=>{
 const roots=[join(homedir(),'.codex','skills'),join(homedir(),'.agents','skills')];
 const items=[],warnings=[];let visited=0;
 function visit(dir,depth){
  if(depth>12||visited++>=20000){warnings.push('扫描达到目录数量或深度上限，部分技能可能未显示。');return}
  let entries;try{entries=readdirSync(dir,{withFileTypes:true})}catch(e){if(e.code!=='ENOENT')warnings.push(`无法读取目录：${dir}`);return}
  for(const entry of entries){
   if(entry.isSymbolicLink())continue;
   const path=join(dir,entry.name);
   if(entry.isDirectory()){if(!['node_modules','.git','.venv','venv','__pycache__'].includes(entry.name))visit(path,depth+1)}
   else if(entry.isFile()&&entry.name.toLowerCase()==='skill.md'){
    try{const st=lstatSync(path);if(st.isFile()&&!st.isSymbolicLink()&&st.size<=1024*1024)items.push({path,text:readFileSync(path,'utf8'),folder:basename(dir)})}catch{warnings.push(`无法读取：${path}`)}
   }
  }
 }
 for(const root of roots)visit(root,0);
 return {content:[{type:'text',text:`扫描完成，发现 ${items.length} 个技能说明。`}],structuredContent:{items,warnings:[...new Set(warnings)]}};
});
server.connect(new StdioServerTransport()).catch(error=>{console.error(error);process.exitCode=1});
