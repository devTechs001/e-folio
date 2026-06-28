import{a as t}from"./vendor-_A3F-HcU.js";let e,a,o,r={data:""},i=t=>{if("object"==typeof window){let e=(t?t.querySelector("#_goober"):window._goober)||Object.assign(document.createElement("style"),{innerHTML:" ",id:"_goober"});return e.nonce=window.__nonce__,e.parentNode||(t||document.head).appendChild(e),e.firstChild}return t||r},s=/(?:([\u0080-\uFFFF\w-%@]+) *:? *([^{;]+?);|([^;}{]*?) *{)|(}\s*)/g,n=/\/\*[^]*?\*\/|  +/g,l=/\n+/g,d=(t,e)=>{let a="",o="",r="";for(let i in t){let s=t[i];"@"==i[0]?"i"==i[1]?a=i+" "+s+";":o+="f"==i[1]?d(s,i):i+"{"+d(s,"k"==i[1]?"":e)+"}":"object"==typeof s?o+=d(s,e?e.replace(/([^,])+/g,t=>i.replace(/([^,]*:\S+\([^)]*\))|([^,])+/g,e=>/&/.test(e)?e.replace(/&/g,t):t?t+" "+e:e)):i):null!=s&&(i=/^--/.test(i)?i:i.replace(/[A-Z]/g,"-$&").toLowerCase(),r+=d.p?d.p(i,s):i+":"+s+";")}return a+(e&&r?e+"{"+r+"}":r)+o},c={},p=t=>{if("object"==typeof t){let e="";for(let a in t)e+=a+p(t[a]);return e}return t},m=(t,e,a,o,r)=>{let i=p(t),m=c[i]||(c[i]=(t=>{let e=0,a=11;for(;e<t.length;)a=101*a+t.charCodeAt(e++)>>>0;return"go"+a})(i));if(!c[m]){let e=i!==t?t:(t=>{let e,a,o=[{}];for(;e=s.exec(t.replace(n,""));)e[4]?o.shift():e[3]?(a=e[3].replace(l," ").trim(),o.unshift(o[0][a]=o[0][a]||{})):o[0][e[1]]=e[2].replace(l," ").trim();return o[0]})(t);c[m]=d(r?{["@keyframes "+m]:e}:e,a?"":"."+m)}let u=a&&c.g?c.g:null;return a&&(c.g=c[m]),((t,e,a,o)=>{o?e.data=e.data.replace(o,t):-1===e.data.indexOf(t)&&(e.data=a?t+e.data:e.data+t)})(c[m],e,o,u),m};function u(t){let e=this||{},a=t.call?t(e.p):t;return m(a.unshift?a.raw?((t,e,a)=>t.reduce((t,o,r)=>{let i=e[r];if(i&&i.call){let t=i(a),e=t&&t.props&&t.props.className||/^go/.test(t)&&t;i=e?"."+e:t&&"object"==typeof t?t.props?"":d(t,""):!1===t?"":t}return t+o+(null==i?"":i)},""))(a,[].slice.call(arguments,1),e.p):a.reduce((t,a)=>Object.assign(t,a&&a.call?a(e.p):a),{}):a,i(e.target),e.g,e.o,e.k)}u.bind({g:1});let f=u.bind({k:1});function g(t,r){let i=this||{};return function(){let r=arguments;return function s(n,l){let d=Object.assign({},n),c=d.className||s.className;i.p=Object.assign({theme:a&&a()},d),i.o=/ *go\d+/.test(c),d.className=u.apply(i,r)+(c?" "+c:"");let p=t;return t[0]&&(p=d.as||t,delete d.as),o&&p[0]&&o(d),e(p,d)}}}var y=(t,e)=>(t=>"function"==typeof t)(t)?t(e):t,b=(()=>{let t=0;return()=>(++t).toString()})(),h=(()=>{let t;return()=>{if(void 0===t&&typeof window<"u"){let e=matchMedia("(prefers-reduced-motion: reduce)");t=!e||e.matches}return t}})(),x="default",v=(t,e)=>{let{toastLimit:a}=t.settings;switch(e.type){case 0:return{...t,toasts:[e.toast,...t.toasts].slice(0,a)};case 1:return{...t,toasts:t.toasts.map(t=>t.id===e.toast.id?{...t,...e.toast}:t)};case 2:let{toast:o}=e;return v(t,{type:t.toasts.find(t=>t.id===o.id)?1:0,toast:o});case 3:let{toastId:r}=e;return{...t,toasts:t.toasts.map(t=>t.id===r||void 0===r?{...t,dismissed:!0,visible:!1}:t)};case 4:return void 0===e.toastId?{...t,toasts:[]}:{...t,toasts:t.toasts.filter(t=>t.id!==e.toastId)};case 5:return{...t,pausedAt:e.time};case 6:let i=e.time-(t.pausedAt||0);return{...t,pausedAt:void 0,toasts:t.toasts.map(t=>({...t,pauseDuration:t.pauseDuration+i}))}}},w=[],$={toasts:[],pausedAt:void 0,settings:{toastLimit:20}},E={},j=(t,e=x)=>{E[e]=v(E[e]||$,t),w.forEach(([t,a])=>{t===e&&a(E[e])})},k=t=>Object.keys(E).forEach(e=>j(t,e)),z=(t=x)=>e=>{j(e,t)},A=t=>(e,a)=>{let o=((t,e="blank",a)=>({createdAt:Date.now(),visible:!0,dismissed:!1,type:e,ariaProps:{role:"status","aria-live":"polite"},message:t,pauseDuration:0,...a,id:(null==a?void 0:a.id)||b()}))(e,t,a);return z(o.toasterId||(t=>Object.keys(E).find(e=>E[e].toasts.some(e=>e.id===t)))(o.id))({type:2,toast:o}),o.id},N=(t,e)=>A("blank")(t,e);N.error=A("error"),N.success=A("success"),N.loading=A("loading"),N.custom=A("custom"),N.dismiss=(t,e)=>{let a={type:3,toastId:t};e?z(e)(a):k(a)},N.dismissAll=t=>N.dismiss(void 0,t),N.remove=(t,e)=>{let a={type:4,toastId:t};e?z(e)(a):k(a)},N.removeAll=t=>N.remove(void 0,t),N.promise=(t,e,a)=>{let o=N.loading(e.loading,{...a,...null==a?void 0:a.loading});return"function"==typeof t&&(t=t()),t.then(t=>{let r=e.success?y(e.success,t):void 0;return r?N.success(r,{id:o,...a,...null==a?void 0:a.success}):N.dismiss(o),t}).catch(t=>{let r=e.error?y(e.error,t):void 0;r?N.error(r,{id:o,...a,...null==a?void 0:a.error}):N.dismiss(o)}),t};var O=f`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
 transform: scale(1) rotate(45deg);
  opacity: 1;
}`,_=f`
from {
  transform: scale(0);
  opacity: 0;
}
to {
  transform: scale(1);
  opacity: 1;
}`,I=f`
from {
  transform: scale(0) rotate(90deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(90deg);
	opacity: 1;
}`,F=g("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${t=>t.primary||"#ff4b4b"};
  position: relative;
  transform: rotate(45deg);

  animation: ${O} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;

  &:after,
  &:before {
    content: '';
    animation: ${_} 0.15s ease-out forwards;
    animation-delay: 150ms;
    position: absolute;
    border-radius: 3px;
    opacity: 0;
    background: ${t=>t.secondary||"#fff"};
    bottom: 9px;
    left: 4px;
    height: 2px;
    width: 12px;
  }

  &:before {
    animation: ${I} 0.15s ease-out forwards;
    animation-delay: 180ms;
    transform: rotate(90deg);
  }
`,C=f`
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
`,D=g("div")`
  width: 12px;
  height: 12px;
  box-sizing: border-box;
  border: 2px solid;
  border-radius: 100%;
  border-color: ${t=>t.secondary||"#e0e0e0"};
  border-right-color: ${t=>t.primary||"#616161"};
  animation: ${C} 1s linear infinite;
`,L=f`
from {
  transform: scale(0) rotate(45deg);
	opacity: 0;
}
to {
  transform: scale(1) rotate(45deg);
	opacity: 1;
}`,S=f`
0% {
	height: 0;
	width: 0;
	opacity: 0;
}
40% {
  height: 0;
	width: 6px;
	opacity: 1;
}
100% {
  opacity: 1;
  height: 10px;
}`,M=g("div")`
  width: 20px;
  opacity: 0;
  height: 20px;
  border-radius: 10px;
  background: ${t=>t.primary||"#61d345"};
  position: relative;
  transform: rotate(45deg);

  animation: ${L} 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
  animation-delay: 100ms;
  &:after {
    content: '';
    box-sizing: border-box;
    animation: ${S} 0.2s ease-out forwards;
    opacity: 0;
    animation-delay: 200ms;
    position: absolute;
    border-right: 2px solid;
    border-bottom: 2px solid;
    border-color: ${t=>t.secondary||"#fff"};
    bottom: 6px;
    left: 6px;
    height: 10px;
    width: 6px;
  }
`,P=g("div")`
  position: absolute;
`,T=g("div")`
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  min-width: 20px;
  min-height: 20px;
`,q=f`
from {
  transform: scale(0.6);
  opacity: 0.4;
}
to {
  transform: scale(1);
  opacity: 1;
}`,H=g("div")`
  position: relative;
  transform: scale(0.6);
  opacity: 0.4;
  min-width: 20px;
  animation: ${q} 0.3s 0.12s cubic-bezier(0.175, 0.885, 0.32, 1.275)
    forwards;
`,Z=({toast:e})=>{let{icon:a,type:o,iconTheme:r}=e;return void 0!==a?"string"==typeof a?t.createElement(H,null,a):a:"blank"===o?null:t.createElement(T,null,t.createElement(D,{...r}),"loading"!==o&&t.createElement(P,null,"error"===o?t.createElement(F,{...r}):t.createElement(M,{...r})))},B=t=>`\n0% {transform: translate3d(0,${-200*t}%,0) scale(.6); opacity:.5;}\n100% {transform: translate3d(0,0,0) scale(1); opacity:1;}\n`,G=t=>`\n0% {transform: translate3d(0,0,-1px) scale(1); opacity:1;}\n100% {transform: translate3d(0,${-150*t}%,-1px) scale(.6); opacity:0;}\n`,J=g("div")`
  display: flex;
  align-items: center;
  background: #fff;
  color: #363636;
  line-height: 1.3;
  will-change: transform;
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.1), 0 3px 3px rgba(0, 0, 0, 0.05);
  max-width: 350px;
  pointer-events: auto;
  padding: 8px 10px;
  border-radius: 8px;
`,K=g("div")`
  display: flex;
  justify-content: center;
  margin: 4px 10px;
  color: inherit;
  flex: 1 1 auto;
  white-space: pre-line;
`;t.memo(({toast:e,position:a,style:o,children:r})=>{let i=e.height?((t,e)=>{let a=t.includes("top")?1:-1,[o,r]=h()?["0%{opacity:0;} 100%{opacity:1;}","0%{opacity:1;} 100%{opacity:0;}"]:[B(a),G(a)];return{animation:e?`${f(o)} 0.35s cubic-bezier(.21,1.02,.73,1) forwards`:`${f(r)} 0.4s forwards cubic-bezier(.06,.71,.55,1)`}})(e.position||a||"top-center",e.visible):{opacity:0},s=t.createElement(Z,{toast:e}),n=t.createElement(K,{...e.ariaProps},y(e.message,e));return t.createElement(J,{className:e.className,style:{...i,...o,...e.style}},"function"==typeof r?r({icon:s,message:n}):t.createElement(t.Fragment,null,s,n))}),function(t,r,i,s){d.p=r,e=t,a=i,o=s}(t.createElement),u`
  z-index: 9999;
  > * {
    pointer-events: auto;
  }
`;var Q=N;export{Q as z};
