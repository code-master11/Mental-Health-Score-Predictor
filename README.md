# Mansik Santulan Score: Student Mental Health Score Predictor

An end-to-end machine learning project that estimates a student's **mental health score (0 to 10)** from their social media habits and daily routine. It includes the data analysis notebook, a trained scikit-learn pipeline, a FastAPI backend and a web dashboard.

> **Disclaimer:** This is an educational project. The score is a statistical estimate learned from survey data. It is **not** a medical diagnosis or professional advice.

**Live API:** https://mental-health-score-predictor-mzy3.onrender.com (interactive docs at `/docs`)

> The API runs on a free hosting plan, so the first request after a period of inactivity can take up to a minute while the server wakes up.

---

## Screenshots

<!-- Add your screenshots to a /screenshots folder and update these paths -->
| Form | Result |
|------|--------|
| ![Form](screenshots/form.png) | ![Result](screenshots/result.png) |

---

## Features

- **Prediction:** enter 12 details about a student and get a score from 0 to 10.
- **Visual result:** a gauge, a band label (Needs attention, Fragile, Steady, Thriving) and a short message.
- **Habit review:** sleep, screen time, phone unlocks, physical activity and stress are rated Healthy, Watch or Improve. These ratings use general wellbeing guidelines and do not come from the model.
- **Recent predictions:** the last five results are listed on screen.
- **Server status:** the header shows whether the API is online.
- **Validation:** inputs are validated on the server with Pydantic, and the UI shows clear error messages.
- **Responsive:** works on desktop and mobile.

---

## How it works

```
Browser (HTML / CSS / JS)  --POST /predict-->  FastAPI + Pydantic  -->  scikit-learn Pipeline  -->  score
```

1. The dashboard sends the form values as JSON to `POST /predict`.
2. FastAPI validates the input, groups the country into the top 10 or "Other", and builds a one-row DataFrame.
3. The saved pipeline (preprocessing and Random Forest together) predicts the score, which is rounded to two decimals and returned.

---

## Dataset

- 5,000 student survey records, 13 columns.
- **Target:** `Mental_Health_Score` (about 3.6 to 9.4).
- **Features:** age, gender, country, academic level, most used platform, purpose of use, average daily usage hours, daily phone unlocks, study hours, physical activity hours, sleep hours per night, stress level.

---

## Machine learning pipeline

Everything is in [`ML_Project.ipynb`](ML_Project.ipynb).

**Cleaning**
- Removed duplicate rows.
- Clipped negative `Physical_Activity_Hours` values to 0 instead of dropping the rows.

**Feature engineering**
- Grouped `Country` into the 10 most common countries plus `Other`, to avoid a very wide one-hot encoding.

**Preprocessing (`ColumnTransformer`)**

| Feature type | Columns | Treatment |
|--------------|---------|-----------|
| Skewed numeric | `Study_Hours` | log transform, then scaling |
| Numeric | age, usage hours, unlocks, activity, sleep | scaling |
| Ordinal | `Stress_Level` | ordinal encoding (Low < Medium < High < Very High) |
| Nominal | gender, academic level, platform, purpose, grouped country | one-hot encoding |

**Models and results** (70/30 train-test split, `random_state=42`)

| Model | Test R² | Test MAE | Test RMSE |
|-------|---------|----------|-----------|
| Linear Regression (baseline) | 0.740 | 0.536 | 0.676 |
| Random Forest (default) | 0.878 | 0.347 | 0.464 |
| Random Forest (tuned, RandomizedSearchCV) | 0.865 | 0.369 | 0.487 |

The saved model (`Mental_Health_Model.pkl`) is the **default Random Forest pipeline**. Its training R² (0.98) is higher than its test R² (0.88), which points to some overfitting. The tuned model narrows that gap (training R² 0.95) at a small cost in test score.

---

## Tech stack

- **ML:** Python, pandas, NumPy, scikit-learn, joblib, matplotlib, seaborn
- **Backend:** FastAPI, Pydantic, Uvicorn
- **Frontend:** HTML, CSS, JavaScript (no frameworks)
- **Deployment:** Render, Git

---

## Project structure

```
.
├── main.py                       # FastAPI app
├── Mental_Health_Model.pkl       # Trained pipeline (preprocessing + Random Forest)
├── requirements.txt
├── ML_Project.ipynb              # Analysis, training and evaluation
├── Student_Social_Media_And_Mental_Health_Impact.csv
├── index.html                    # Web dashboard
├── style.css
├── script.js
└── README.md
```

---

## Run it locally

**1. Clone and install**

```bash
git clone <your-repo-url>
cd <your-repo-folder>
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

**2. Start the API**

```bash
uvicorn main:app --reload
```

The API runs at `http://127.0.0.1:8000`. Open `http://127.0.0.1:8000/docs` to try it in the browser.

**3. Open the dashboard**

Open `script.js` and set the first line to your local server:

```js
const API = 'http://127.0.0.1:8000';
```

Then open `index.html` in your browser.

> Use the same scikit-learn version that was used to train the model, otherwise loading the `.pkl` file can fail or show warnings. Pin it in `requirements.txt`.

---

## API reference

### `GET /`
Health check. Returns a welcome message.

### `POST /predict`

**Request body**

```json
{
  "age": 21,
  "gender": "Female",
  "country": "India",
  "academic_level": "Undergraduate",
  "most_used_platform": "Instagram",
  "purpose_of_use": "Entertainment",
  "avg_daily_usage_hours": 4.5,
  "daily_unlocks": 120,
  "study_hours": 4,
  "physical_activity_hours": 1.5,
  "sleep_hours_per_night": 7,
  "stress_level": "Medium"
}
```

**Response**

```json
{ "predicted_mental_health_score": 7.12 }
```

**Allowed values**

| Field | Values |
|-------|--------|
| `gender` | Male, Female |
| `academic_level` | High School, Undergraduate, Graduate |
| `most_used_platform` | Facebook, LinkedIn, Instagram, Snapchat, Twitter, YouTube, TikTok, LINE, KakaoTalk, VKontakte, WhatsApp, WeChat |
| `purpose_of_use` | Networking, Education, Entertainment, News |
| `stress_level` | Low, Medium, High, Very High |
| `age` | 10 to 100 |
| hour fields | 0 to 24 |

**Errors:** `422` means an input value is invalid. `404` usually means the request URL is wrong (check for a double slash such as `//predict`).

**Example with curl**

```bash
curl -X POST https://mental-health-score-predictor-mzy3.onrender.com/predict \
  -H "Content-Type: application/json" \
  -d '{"age":21,"gender":"Female","country":"India","academic_level":"Undergraduate","most_used_platform":"Instagram","purpose_of_use":"Entertainment","avg_daily_usage_hours":4.5,"daily_unlocks":120,"study_hours":4,"physical_activity_hours":1.5,"sleep_hours_per_night":7,"stress_level":"Medium"}'
```

---

## Limitations

- The model learns patterns from one survey dataset, mostly of students aged 18 to 24. Predictions for other ages or very unusual habits are less reliable.
- The data shows correlation, not cause. A low predicted score does not mean social media caused it.
- The score is an estimate and cannot replace a doctor or counsellor.

## Future improvements

- Show which factors pushed a prediction up or down (feature importance or SHAP).
- Compare more models such as gradient boosting.
- Add automated tests for the API.

---

## Author

**Your Name**
[LinkedIn](https://www.linkedin.com/in/your-profile) · [GitHub](https://github.com/your-username)

## License

Add a license of your choice (for example MIT) in a `LICENSE` file.
