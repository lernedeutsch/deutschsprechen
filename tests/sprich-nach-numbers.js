const fs=require("fs");
const vm=require("vm");
const assert=require("assert");

const source=fs.readFileSync("js/sprich-nach-match.js","utf8");
const sandbox={window:{}};
vm.runInNewContext(source,sandbox);
const m=sandbox.window.SprichNachMatcher;

const words=[
"null","eins","zwei","drei","vier","fünf","sechs","sieben","acht","neun","zehn",
"elf","zwölf","dreizehn","vierzehn","fünfzehn","sechzehn","siebzehn","achtzehn","neunzehn","zwanzig"
];
words.forEach((word,n)=>assert.strictEqual(m.isMatch(word,String(n)),true,word+"="+n));

const good=[
["einundzwanzig","21"],["fünfundzwanzig","25"],["dreißig","30"],["einunddreißig","31"],
["fünfunddreißig","35"],["vierzig","40"],["achtundvierzig","48"],["fünfzig","50"],
["siebenundsechzig","67"],["siebzig","70"],["neunundsiebzig","79"],["achtzig","80"],
["neunzig","90"],["neunundneunzig","99"],["hundert","100"],["dreissig","30"],
["Ich bin 35 Jahre alt.","Ich bin fünfunddreißig Jahre alt."],
["Ich bin dreißig Jahre alt.","Ich bin 30 Jahre alt."]
];
good.forEach(([a,b])=>assert.strictEqual(m.isMatch(a,b),true,a+" <=> "+b));

const bad=[["30","13"],["35","53"],["48","40"],["17","70"],["dreizehn","dreißig"],["siebzehn","siebzig"]];
bad.forEach(([a,b])=>assert.strictEqual(m.isMatch(a,b),false,a+" != "+b));

for(let n=0;n<=100;n++){
  assert.strictEqual(m.isMatch(String(n),String(n)),true,"digits "+n);
}
console.log("Sprich-nach number matching: all tests passed");
