(function () {
  "use strict";
  const QUESTION_COUNT = 10;
  const FLAG_BASE = "https://flagcdn.com/w320/";
  const byId = (id) => document.getElementById(id);
  const el = {
    mode: byId("quiz-mode"), continent: byId("quiz-continent"), intro: byId("quiz-intro"),
    game: byId("quiz-game"), results: byId("quiz-results"), start: byId("quiz-start"),
    next: byId("quiz-next"), again: byId("quiz-again"), prompt: byId("quiz-prompt"),
    visual: byId("quiz-visual"), options: byId("quiz-options"), feedback: byId("quiz-feedback"),
    progress: byId("quiz-progress"), progressBar: byId("quiz-progress-bar"),
    progressLabel: byId("quiz-progress-label"), scoreLabel: byId("quiz-score-label"),
    questionCount: byId("quiz-question-count"), resultTitle: byId("quiz-result-title"),
    resultScore: byId("quiz-result-score"), review: byId("quiz-review")
  };
  const copy = {
    de: {
      eyebrow:"Teste dein Wissen", title:"Wie gut kennst du die Länder der Welt?",
      description:"Erkenne Flaggen und ordne Hauptstädte den richtigen Ländern zu.",
      mode:"Quiz-Modus", flags:"Flaggen erkennen", capitals:"Hauptstädte zuordnen",
      region:"Region", all:"Alle Kontinente", continents:["Europa","Asien","Afrika","Nordamerika","Südamerika","Ozeanien"],
      round:"10 Fragen · 4 Antwortmöglichkeiten", start:"Quiz starten",
      progress:(n)=>`Frage ${n} von 10`, points:(n)=>`Punkte: ${n}`,
      flagPrompt:"Zu welchem Land gehört diese Flagge?", capitalPrompt:"Zu welchem Land gehört diese Hauptstadt?",
      correct:"Richtig! Gut gemacht.", wrong:(name)=>`Leider falsch. Richtig wäre: ${name}.`,
      next:"Weiter", finish:"Ergebnis ansehen", done:"Runde beendet",
      result:(n)=>n===10?"Perfekt! Alle richtig.":n>=7?"Starke Leistung!":n>=4?"Guter Anfang!":"Weiter üben!",
      score:(n)=>`${n} von 10 richtig`, missed:"Diese Länder waren noch schwierig:",
      allCorrect:"Keine Fehler – alle Antworten waren richtig.", again:"Nochmal spielen", wrongMark:"Falsch"
    },
    en: {
      eyebrow:"Test your knowledge", title:"How well do you know the countries of the world?",
      description:"Recognize flags and match capitals to the right countries.",
      mode:"Quiz mode", flags:"Identify the flag", capitals:"Match the capital",
      region:"Region", all:"All continents", continents:["Europe","Asia","Africa","North America","South America","Oceania"],
      round:"10 questions · 4 answer choices", start:"Start quiz",
      progress:(n)=>`Question ${n} of 10`, points:(n)=>`Score: ${n}`,
      flagPrompt:"Which country does this flag belong to?", capitalPrompt:"Which country has this capital?",
      correct:"Correct! Well done.", wrong:(name)=>`Not quite. The correct answer is ${name}.`,
      next:"Next", finish:"See results", done:"Round complete",
      result:(n)=>n===10?"Perfect score!":n>=7?"Great work!":n>=4?"Good start!":"Keep practicing!",
      score:(n)=>`${n} out of 10 correct`, missed:"Review these answers:",
      allCorrect:"No mistakes – every answer was correct.", again:"Play again", wrongMark:"Missed"
    }
  };
  let questions=[], index=0, score=0, answered=false, mistakes=[];
  const lang=()=>typeof language!=="undefined"&&language==="en"?"en":"de";
  const t=()=>copy[lang()];
  const name=(country)=>typeof displayName==="function"?displayName(country):country.name;
  const flag=(code)=>FLAG_BASE+code.toLowerCase()+".png";
  function shuffle(items){
    const result=[...items];
    for(let i=result.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[result[i],result[j]]=[result[j],result[i]];}
    return result;
  }
  function buildQuestions(){
    const region=el.continent.value;
    const pool=COUNTRIES.filter(c=>region==="all"||c.continent===region);
    if(pool.length<4){el.feedback.textContent=lang()==="de"?"Für diese Region sind nicht genügend Länder vorhanden.":"There are not enough countries in this region.";return false;}
    questions=shuffle(pool).slice(0,Math.min(QUESTION_COUNT,pool.length)).map(country=>({
      country, options:shuffle([country,...shuffle(pool.filter(c=>c.code!==country.code)).slice(0,3)])
    }));
    return questions.length===QUESTION_COUNT&&questions.every(q=>q.options.length===4);
  }
  function start(){
    if(!buildQuestions())return;
    index=0;score=0;answered=false;mistakes=[];
    el.intro.hidden=true;el.results.hidden=true;el.game.hidden=false;render();
  }
  function render(){
    const q=questions[index],s=t();
    answered=false;
    el.progressLabel.textContent=s.progress(index+1);el.scoreLabel.textContent=s.points(score);
    el.progress.setAttribute("aria-valuenow",String(index));el.progressBar.style.width=`${index/QUESTION_COUNT*100}%`;
    el.prompt.textContent=el.mode.value==="flags"?s.flagPrompt:s.capitalPrompt;
    el.visual.replaceChildren();
    if(el.mode.value==="flags"){
      const img=document.createElement("img");img.src=flag(q.country.code);img.alt=lang()==="de"?"Flagge":"Flag";img.loading="eager";el.visual.appendChild(img);
    }else{
      const capital=document.createElement("div");capital.className="quiz-capital";capital.textContent=q.country.capital;el.visual.appendChild(capital);
    }
    el.options.replaceChildren();
    q.options.forEach(option=>{
      const button=document.createElement("button");button.type="button";button.className="quiz-option";button.textContent=name(option);
      button.addEventListener("click",()=>answer(option,button));el.options.appendChild(button);
    });
    el.feedback.textContent="";el.feedback.className="quiz-feedback";el.next.hidden=true;
    el.next.textContent=index===QUESTION_COUNT-1?s.finish:s.next;el.questionCount.textContent=s.round;
  }
  function answer(selected,selectedButton){
    if(answered)return;answered=true;
    const correct=selected.code===questions[index].country.code;
    if(correct)score++;else mistakes.push(questions[index].country);
    for(const button of el.options.querySelectorAll("button")){
      button.disabled=true;
      const option=questions[index].options.find(c=>name(c)===button.textContent);
      if(option&&option.code===questions[index].country.code)button.classList.add("correct");
    }
    if(!correct)selectedButton.classList.add("incorrect");
    el.feedback.textContent=correct?t().correct:t().wrong(name(questions[index].country));
    el.feedback.classList.add(correct?"correct":"incorrect");el.scoreLabel.textContent=t().points(score);el.next.hidden=false;
  }
  function advance(){
    if(!answered)return;index++;
    if(index>=questions.length){results();return;}render();
  }
  function results(){
    el.game.hidden=true;el.results.hidden=false;
    byId("quiz-result-eyebrow").textContent=t().done;
    el.resultTitle.textContent=t().result(score);el.resultScore.textContent=t().score(score);el.review.replaceChildren();
    if(!mistakes.length){
      const p=document.createElement("p");p.className="quiz-review-empty";p.textContent=t().allCorrect;el.review.appendChild(p);
    }else{
      const heading=document.createElement("p");heading.className="quiz-review-empty";heading.textContent=t().missed;el.review.appendChild(heading);
      mistakes.forEach(country=>{
        const row=document.createElement("div");row.className="quiz-review-item";
        const img=document.createElement("img");img.src=flag(country.code);img.alt="";
        const label=document.createElement("span");label.textContent=name(country);
        const mark=document.createElement("strong");mark.textContent=t().wrongMark;
        row.append(img,label,mark);el.review.appendChild(row);
      });
    }
  }
  function updateLanguage(){
    const s=t();
    byId("quiz-eyebrow").textContent=s.eyebrow;byId("quiz-title").textContent=s.title;
    byId("quiz-description").textContent=s.description;byId("quiz-mode-label").textContent=s.mode;
    el.mode.options[0].textContent=s.flags;el.mode.options[1].textContent=s.capitals;
    byId("quiz-continent-label").textContent=s.region;el.continent.options[0].textContent=s.all;
    s.continents.forEach((value,i)=>{el.continent.options[i+1].textContent=value;});
    byId("quiz-round-info").textContent=s.round;el.start.textContent=s.start;el.again.textContent=s.again;
    if(!el.game.hidden&&questions.length)render();
    else if(!el.results.hidden)results();
  }
  el.start.addEventListener("click",start);el.again.addEventListener("click",start);
  el.next.addEventListener("click",advance);document.addEventListener("language-changed",updateLanguage);
  updateLanguage();
})();