// Change this if your FastAPI server runs elsewhere.
const API = 'http://127.0.0.1:8000';

const opts = {
  gender: ['Male', 'Female'],
  academic: ['High School', 'Undergraduate', 'Graduate'],
  stress: ['Low', 'Medium', 'High', 'Very High'],
  platform: ['Instagram', 'TikTok', 'YouTube', 'WhatsApp', 'Facebook', 'Snapchat', 'Twitter', 'LinkedIn', 'WeChat', 'LINE', 'KakaoTalk', 'VKontakte'],
  purpose: ['Entertainment', 'Education', 'Networking', 'News'],
  country: ['India', 'USA', 'Canada', 'Australia', 'UK', 'Germany', 'Mexico', 'Turkey', 'France', 'Bangladesh', 'Brazil', 'Japan', 'South Korea', 'Spain', 'Italy', 'Russia', 'China', 'Sweden', 'Norway', 'Denmark', 'Netherlands', 'Belgium', 'Switzerland', 'Austria', 'Portugal', 'Greece', 'Ireland', 'New Zealand', 'Singapore', 'Malaysia', 'Thailand', 'Vietnam', 'Philippines', 'Indonesia', 'Taiwan', 'Hong Kong', 'Israel', 'UAE', 'Egypt', 'Morocco', 'South Africa', 'Nigeria', 'Kenya', 'Ghana', 'Argentina', 'Chile', 'Colombia', 'Peru', 'Venezuela', 'Ecuador', 'Uruguay', 'Paraguay', 'Bolivia', 'Costa Rica', 'Panama', 'Jamaica', 'Trinidad', 'Bahamas', 'Iceland', 'Other']
};
const defaults = { gender: 'Female', academic: 'Undergraduate', stress: 'Medium' };
const $ = id => document.getElementById(id);
const radio = n => document.querySelector(`input[name="${n}"]:checked`).value;

function buildSeg(id) {
  $(id).innerHTML = opts[id].map((v, i) =>
    `<input type="radio" name="${id}" id="${id}${i}" value="${v}" ${v === defaults[id] ? 'checked' : ''}><label for="${id}${i}">${v}</label>`).join('');
}
['gender', 'academic', 'stress'].forEach(buildSeg);
['platform', 'purpose', 'country'].forEach(k => $(k).innerHTML = opts[k].map(v => `<option>${v}</option>`).join(''));
$('country').value = 'India';

document.querySelectorAll('[data-slider]').forEach(el => {
  const d = el.dataset, id = 's_' + d.slider;
  el.innerHTML = `<div class="sh"><label for="${id}">${d.label}</label><output id="${id}o">${d.val}${d.unit}</output></div>
    <input type="range" id="${id}" min="${d.min}" max="${d.max}" step="${d.step}" value="${d.val}">`;
  $(id).addEventListener('input', e => $(id + 'o').textContent = e.target.value + d.unit);
});

// ---- Server status ----
async function checkServer() {
  const s = $('status');
  try {
    await fetch(API + '/', { method: 'GET' });
    s.className = 'status on'; s.querySelector('span').textContent = 'Model server online';
  } catch {
    s.className = 'status off'; s.querySelector('span').textContent = 'Model server offline';
  }
}
checkServer(); setInterval(checkServer, 15000);

// ---- Result helpers ----
const band = s => s < 5 ? ['Needs attention', '#D64550', 'Habits point to a lower balance. Sleep, activity and stress are the biggest areas to review.']
  : s < 6.5 ? ['Fragile', '#E9A23B', 'A middling balance. Small changes to sleep or screen time could improve it.']
  : s < 8 ? ['Steady', '#1F9D7A', 'A healthy balance. Keep sleep and activity consistent.']
  : ['Thriving', '#1F9D7A', 'A strong balance. This routine looks well supported.'];

const grade = (v, good, fair) => v <= good ? 'good' : v <= fair ? 'fair' : 'poor';
function habits(b) {
  const sleep = b.sleep_hours_per_night >= 7 && b.sleep_hours_per_night <= 9 ? 'good' : b.sleep_hours_per_night >= 6 ? 'fair' : 'poor';
  const act = b.physical_activity_hours >= 1 ? 'good' : b.physical_activity_hours >= .5 ? 'fair' : 'poor';
  const stress = { Low: 'good', Medium: 'fair', High: 'poor', 'Very High': 'poor' }[b.stress_level];
  return [
    ['Sleep', `${b.sleep_hours_per_night} h per night`, sleep],
    ['Screen time', `${b.avg_daily_usage_hours} h per day`, grade(b.avg_daily_usage_hours, 3, 5)],
    ['Phone unlocks', `${b.daily_unlocks} per day`, grade(b.daily_unlocks, 100, 150)],
    ['Physical activity', `${b.physical_activity_hours} h per day`, act],
    ['Stress', b.stress_level, stress]
  ];
}
const label = { good: 'Healthy', fair: 'Watch', poor: 'Improve' };

const history = [];
function renderHistory() {
  $('histCard').hidden = !history.length;
  $('hist').innerHTML = history.map(h => `<li><span>${h.time} · age ${h.age}, ${h.stress} stress</span><b>${h.score.toFixed(1)}</b></li>`).join('');
}

// ---- Submit ----
$('f').addEventListener('submit', async e => {
  e.preventDefault();
  const msg = $('msg'), btn = $('go'), age = parseInt($('age').value, 10);
  msg.className = 'msg';
  if (!(age >= 10 && age <= 100)) { msg.className = 'msg err'; msg.textContent = 'Enter an age between 10 and 100.'; return; }
  const body = {
    age, gender: radio('gender'), country: $('country').value, academic_level: radio('academic'),
    most_used_platform: $('platform').value, purpose_of_use: $('purpose').value,
    avg_daily_usage_hours: +$('s_usage').value, daily_unlocks: +$('s_unlocks').value,
    study_hours: +$('s_study').value, physical_activity_hours: +$('s_activity').value,
    sleep_hours_per_night: +$('s_sleep').value, stress_level: radio('stress')
  };
  btn.disabled = true; btn.textContent = 'Calculating…';
  try {
    const res = await fetch(API + '/predict', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
    if (!res.ok) throw new Error(`The server rejected the input (${res.status}). Check the values and try again.`);
    const s = Math.max(0, Math.min(10, (await res.json()).predicted_mental_health_score));
    const [name, color, text] = band(s);
    $('num').textContent = s.toFixed(1);
    $('band').textContent = name; $('band').style.cssText = `background:${color};color:#fff`;
    $('needle').style.transform = `rotate(${-90 + s / 10 * 180}deg)`;
    msg.textContent = text;
    $('habitList').innerHTML = habits(body).map(([n, d, g]) =>
      `<li><div>${n}<small>${d}</small></div><span class="chip ${g}">${label[g]}</span></li>`).join('');
    $('habits').hidden = false;
    history.unshift({ score: s, age, stress: body.stress_level, time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) });
    history.splice(5); renderHistory();
    $('status').className = 'status on'; $('status').querySelector('span').textContent = 'Model server online';
  } catch (err) {
    msg.className = 'msg err';
    msg.innerHTML = err instanceof TypeError ? 'Cannot reach the model server. Start it with <code>uvicorn main:app --reload</code>.' : err.message;
  } finally { btn.disabled = false; btn.textContent = 'Predict score'; }
});

$('reset').addEventListener('click', () => {
  $('f').reset();
  document.querySelectorAll('[data-slider] input').forEach(i => i.dispatchEvent(new Event('input')));
  $('num').textContent = '–'; $('band').textContent = 'No result yet'; $('band').style.cssText = '';
  $('needle').style.transform = 'rotate(-90deg)'; $('habits').hidden = true;
  $('msg').className = 'msg'; $('msg').textContent = 'Complete the form and select Predict score.';
});
