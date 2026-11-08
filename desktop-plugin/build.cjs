const esbuild=require('esbuild');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const dir=__dirname;
 const js=await esbuild.build({entryPoints:[path.join(dir,'src/app.js')],bundle:true,write:false,platform:'browser',format:'esm',target:'es2022',minify:true});
 const css=fs.readFileSync(path.join(dir,'src/style.css'),'utf8');
 const script=js.outputFiles[0].text.replace(/<\/script/gi,'<\\/script');
 const html=fs.readFileSync(path.join(dir,'src/panel.html'),'utf8').replace('__CSS__',()=>css).replace('<script>__JS__</script>',()=>`<script type="module">${script}</script>`);
 fs.writeFileSync(path.join(dir,'panel.html'),html);
 await esbuild.build({entryPoints:[path.join(dir,'src/server.js')],bundle:true,platform:'node',format:'cjs',target:'node20',outfile:path.join(dir,'server.cjs')});
})().catch(error=>{console.error(error);process.exitCode=1});
