(function(global){
  "use strict";

  const ONES={
    null:0,ein:1,eins:1,eine:1,einen:1,einem:1,einer:1,
    zwei:2,drei:3,vier:4,fuenf:5,sechs:6,sieben:7,acht:8,neun:9,
    zehn:10,elf:11,zwoelf:12,dreizehn:13,vierzehn:14,fuenfzehn:15,
    sechzehn:16,siebzehn:17,achtzehn:18,neunzehn:19
  };
  const TENS={zwanzig:20,dreissig:30,vierzig:40,fuenfzig:50,sechzig:60,siebzig:70,achtzig:80,neunzig:90};
  const SIMPLE={...ONES,...TENS,hundert:100,einhundert:100};

  function normalizeText(value){
    return String(value??"")
      .toLowerCase()
      .replace(/ä/g,"ae").replace(/ö/g,"oe").replace(/ü/g,"ue").replace(/ß/g,"ss")
      .replace(/[.,!?;:„“"'’]/g," ")
      .replace(/\s+/g," ").trim();
  }

  function parseGermanNumberToken(raw){
    const token=normalizeText(raw).replace(/\s+/g,"");
    if(!token)return null;
    if(/^\d+$/.test(token))return Number(token);
    if(Object.prototype.hasOwnProperty.call(SIMPLE,token))return SIMPLE[token];
    if(token.endsWith("hundert")){
      const head=token.slice(0,-7);
      const h=head===""?1:SIMPLE[head];
      return Number.isInteger(h)&&h>=1&&h<=9?h*100:null;
    }
    const und=token.match(/^(.+)und(.+)$/);
    if(und){
      const one=SIMPLE[und[1]],ten=TENS[und[2]];
      if(Number.isInteger(one)&&one>=1&&one<=9&&Number.isInteger(ten))return ten+one;
    }
    return null;
  }

  function canonicalizeNumbers(value){
    return normalizeText(value).split(" ").map(token=>{
      const parsed=parseGermanNumberToken(token);
      return parsed===null?token:String(parsed);
    }).join(" ");
  }

  function levenshtein(a,b){
    const m=a.length,n=b.length;
    const dp=Array.from({length:m+1},()=>new Array(n+1).fill(0));
    for(let i=0;i<=m;i++)dp[i][0]=i;
    for(let j=0;j<=n;j++)dp[0][j]=j;
    for(let i=1;i<=m;i++)for(let j=1;j<=n;j++){
      dp[i][j]=a[i-1]===b[j-1]?dp[i-1][j-1]:1+Math.min(dp[i-1][j-1],dp[i-1][j],dp[i][j-1]);
    }
    return dp[m][n];
  }

  function isMatch(said,target){
    const a=canonicalizeNumbers(said);
    const b=canonicalizeNumbers(target);
    if(!a)return false;
    if(a===b)return true;
    const dist=levenshtein(a,b);
    return 1-dist/Math.max(a.length,b.length)>=0.68;
  }

  global.SprichNachMatcher={normalizeText,parseGermanNumberToken,canonicalizeNumbers,isMatch};
})(window);
