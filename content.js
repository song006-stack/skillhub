// These are page-compatibility selectors, not a public ChatGPT API.
const editorSelectors = [
  '#prompt-textarea',
  'main form [contenteditable="true"][role="textbox"]',
  'main form [contenteditable="true"].ProseMirror',
  'main form textarea',
  'main [contenteditable="true"][role="textbox"]',
  'main textarea[placeholder]'
];

function findEditor() {
  for (const selector of editorSelectors) {
    for (const element of document.querySelectorAll(selector)) {
      if (!element.disabled && element.getClientRects().length &&
          (element.isContentEditable || element.tagName === 'TEXTAREA')) return element;
    }
  }
  return null;
}

chrome.runtime.onMessage.addListener((request, sender, respond) => {
  if (request.type !== 'SKILLHUB_INSERT') return;
  const editor = findEditor();
  if (!editor) { respond({ok:false, error:'未识别到当前页面的输入框。请使用“复制指令”，然后手动粘贴。'}); return; }
  editor.focus();
  const before = editor.isContentEditable ? editor.innerText : editor.value;
  const addition = (before.trim() ? '\n\n' : '') + request.text;
  if (editor.isContentEditable) {
    const selection = window.getSelection();
    const range = document.createRange(); range.selectNodeContents(editor); range.collapse(false);
    selection.removeAllRanges(); selection.addRange(range);
    document.execCommand('insertText', false, addition);
  } else {
    const setter = Object.getOwnPropertyDescriptor(HTMLTextAreaElement.prototype, 'value').set;
    setter.call(editor, before + addition);
    editor.dispatchEvent(new Event('input', {bubbles:true}));
  }
  const after = editor.isContentEditable ? editor.innerText : editor.value;
  if (after === before || !after.includes(request.text.slice(0, 40))) {
    respond({ok:false, error:'未能插入指令。请使用“复制指令”，然后手动粘贴。'}); return;
  }
  if (request.send) {
    setTimeout(() => {
      const button = document.querySelector('[data-testid="send-button"]');
      if (!button || button.disabled) { respond({ok:false, error:'指令已插入，但未找到可用发送按钮；请手动检查并发送。', inserted:true}); return; }
      button.click(); respond({ok:true});
    }, 300);
    return true;
  }
  respond({ok:true});
});
