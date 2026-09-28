/* Deutschsprechen — darmowy wspólny korektor odpowiedzi.
   Bez zewnętrznego/płatnego API. Działa w przeglądarce i wykorzystuje
   kontekst tury: instruction, example, requireFullSentence, allowShort i check. */
(function(global){
  "use strict";

  function normalize(text){
    return String(text||"").toLowerCase()
      .replace(/[.,!?;:„“"']/g," ")
      .replace(/\s+/g," ").trim();
  }

  function words(text){ return normalize(text).split(" ").filter(Boolean); }

  function looksLikeNoIdea(text){
    return /^(weiß nicht|weiss nicht|ich weiß nicht|ich weiss nicht|keine ahnung)$/.test(normalize(text));
  }

  function buildHelp(turn, reason){
    const instruction=(turn&&turn.instruction)||"Antworte passend auf die Frage.";
    const example=(turn&&turn.example)||"Versuche es noch einmal.";
    let lead="Noch nicht ganz.";
    if(reason==="too_short") lead="Bitte antworte mit einem ganzen Satz.";
    if(reason==="no_idea") lead="Kein Problem — hier ist eine Hilfe.";
    return {
      status:lead+" Nutze die Hilfe und versuche es noch einmal.",
      help:`Hilfe: ${instruction} Zum Beispiel: „${example}“`
    };
  }

  function assess(rawText,turn){
    const answer=normalize(rawText);
    const count=words(answer).length;
    if(!answer) return {ok:false,reason:"empty",...buildHelp(turn,"empty")};
    if(looksLikeNoIdea(answer)) return {ok:false,reason:"no_idea",...buildHelp(turn,"no_idea")};
    if(turn&&turn.requireFullSentence&&!turn.allowShort&&count<=2)
      return {ok:false,reason:"too_short",...buildHelp(turn,"too_short")};

    let ok=false;
    try{ ok=!!(turn&&typeof turn.check==="function"&&turn.check(answer)); }
    catch(_error){ ok=false; }
    return ok
      ? {ok:true,reason:"correct"}
      : {ok:false,reason:"incorrect",...buildHelp(turn,"incorrect")};
  }

  global.DeutschsprechenCorrector={normalize,assess,buildHelp};
})(window);
