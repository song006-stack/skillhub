(function(root){
const categories=['PPT 类','图片类','代码类','文档类','学术研究类','自动化类','其他类'];
const rules=[
 ['学术研究类','论文研究',/paper|academic|research|scholar|论文|学术|文献/i,'解读研究论文并梳理方法与证据。'],
 ['PPT 类','演示文稿',/ppt|slides?|presentation|演示文稿|幻灯片/i,'制作演示文稿并优化内容与排版。'],
 ['图片类','图片处理',/image|photo|illustrat|图像|图片|绘图/i,'生成或处理图片并调整视觉效果。'],
 ['代码类','软件开发',/code|coding|frontend|developer|software|编程|代码|前端/i,'辅助软件开发、代码编写与调试。'],
 ['文档类','文档处理',/document|docx|pdf|word|文档|报告/i,'创建、编辑或整理文档与报告。'],
 ['自动化类','流程自动化',/automat|workflow|schedule|自动化|工作流/i,'简化重复操作并组织自动化流程。']
];
function metadata(text,fallback){
 const front=text.match(/^---\s*\r?\n([\s\S]*?)\r?\n---/); let name='', description='';
 if(front){name=(front[1].match(/^name:\s*["']?([^\r\n"']+)/mi)||[])[1]||''; description=(front[1].match(/^description:\s*["']?([^\r\n"']+)/mi)||[])[1]||'';}
 name=name.trim() || ((text.match(/^#\s+(.+)$/m)||[])[1]||fallback||'未命名技能').trim();
 description=description.trim() || text.replace(/^---[\s\S]*?---/,'').split(/\r?\n/).map(x=>x.trim()).find(x=>x && !x.startsWith('#')) || '暂无详细介绍';
 const hay=(name+' '+description+' '+text.slice(0,4000)); const rule=rules.find(r=>r[2].test(hay));
 let summary=rule?rule[3]:'根据技能说明协助完成指定任务。';
 const chinese=description.match(/[\u4e00-\u9fff，、及与并的和]{10,25}/); if(chinese) summary=chinese[0].replace(/[，、]$/,'')+'。';
 return {name,description,summary,category:rule?rule[0]:'其他类',subcategory:rule?rule[1]:'其他技能',platform:/\bcodex\b/i.test(hay)&&!/\bchatgpt\b/i.test(hay)?'Codex':/\bchatgpt\b/i.test(hay)&&!/\bcodex\b/i.test(hay)?'ChatGPT':'通用'};
}
function parseGithub(url){const u=new URL(url); if(u.protocol!=='https:'||u.hostname!=='github.com')throw Error('请输入 https://github.com/用户名/仓库 地址');const parts=u.pathname.split('/').filter(Boolean);if(parts.length!==2||!parts.every(x=>/^[\w.-]+$/.test(x)))throw Error('请输入仓库首页地址，不支持分支或子目录链接');return {owner:parts[0],repo:parts[1].replace(/\.git$/,'')};}
function buildPrompt(skill){return `请帮我调用 ${skill.name} Skill`;}
function matchesPlatform(skillPlatform,filter){return filter==='all'||skillPlatform===filter||((filter==='ChatGPT'||filter==='Codex')&&skillPlatform==='通用');}
// Legacy platform values were inferred from keywords, not verified or chosen.
function platformForDisplay(skill){return skill.platformConfirmed===true&&['ChatGPT','Codex','通用'].includes(skill.platform)?skill.platform:'待确认';}
// Group only for display. Keeping the original records makes re-import and file ownership safe.
function groupSkills(skills){
 const groups=[], index=new Map();
 for(const skill of skills){
  const key=JSON.stringify([skill.name,skill.skillText]);
  let group=index.get(key);
  if(!group){group={...skill,files:[...(skill.files||[])],memberIds:[skill.id],sourceCount:1};index.set(key,group);groups.push(group)}
  else {group.files.push(...(skill.files||[]));group.memberIds.push(skill.id);group.sourceCount++;group.favorite=group.favorite||skill.favorite;group.lastUsed=Math.max(group.lastUsed||0,skill.lastUsed||0)}
 }
 return groups;
}
root.SkillHubCore={categories,metadata,parseGithub,buildPrompt,groupSkills,matchesPlatform,platformForDisplay}; if(typeof module!=='undefined')module.exports=root.SkillHubCore;
})(globalThis);
