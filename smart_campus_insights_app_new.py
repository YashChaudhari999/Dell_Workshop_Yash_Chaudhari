# streamlit_smart_campus_app.py
# Smart Campus Insights — Streamlit app
# Usage: put attendance_logs.csv, event_participation.csv, lms_usage.csv
# in the same folder and run: streamlit run streamlit_smart_campus_app.py

import streamlit as st
import pandas as pd
import numpy as np
from sklearn.tree import DecisionTreeClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report

st.set_page_config(page_title="Smart Campus Insights", layout="wide")

@st.cache_data
def load_attendance(path="attendance_logs.csv"):
    df = pd.read_csv(path)
    # Normalize column names
    df.columns = [c.strip() for c in df.columns]
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    return df

@st.cache_data
def load_events(path="event_participation.csv"):
    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    return df

@st.cache_data
def load_lms(path="lms_usage.csv"):
    df = pd.read_csv(path)
    df.columns = [c.strip() for c in df.columns]
    if 'Date' in df.columns:
        df['Date'] = pd.to_datetime(df['Date'], errors='coerce')
    # Ensure numeric columns
    for c in ['SessionDuration', 'PagesViewed']:
        if c in df.columns:
            df[c] = pd.to_numeric(df[c], errors='coerce')
    return df

# Load data
try:
    attendance_df = load_attendance()
    events_df = load_events()
    lms_df = load_lms()
except Exception as e:
    st.error(f"Error loading CSV files: {e}\nMake sure attendance_logs.csv, event_participation.csv, lms_usage.csv exist in the app folder.")
    st.stop()

st.title("📊 Smart Campus Insights")
st.sidebar.header("🔍 Filters & Selection Options")

# Enhanced, flexible selection options
all_students = sorted(attendance_df['StudentID'].dropna().unique())
students_with_lms = sorted(lms_df['StudentID'].dropna().unique()) if 'StudentID' in lms_df.columns else []
events_list = sorted(events_df['EventName'].dropna().unique()) if 'EventName' in events_df.columns else []

selection_mode = st.sidebar.selectbox("Selection Mode", [
    "All Students",
    "By Student (Single)",
    "By Students (Multiple)",
    "By Event",
    "By Engagement (heuristic)",
    "Top N Active",
    "Search"
])

selected_students = []

# Quick helper: option to restrict to students who have LMS records
restrict_to_lms = st.sidebar.checkbox("Only students with LMS data", value=False)
available_students = students_with_lms if restrict_to_lms and students_with_lms else all_students

if selection_mode == "All Students":
    selected_students = available_students

elif selection_mode == "By Student (Single)":
    selected_students = [st.sidebar.selectbox("Select a student", available_students)]

elif selection_mode == "By Students (Multiple)":
    default = available_students[:10] if len(available_students) > 10 else available_students
    selected_students = st.sidebar.multiselect("Select students", available_students, default=default)

elif selection_mode == "By Event":
    if events_list:
        chosen_event = st.sidebar.selectbox("Choose Event", events_list)
        # students who attended the chosen event
        selected_students = sorted(events_df[events_df['EventName'] == chosen_event]['StudentID'].dropna().unique())
    else:
        st.sidebar.info("No Event data available")
        selected_students = []

elif selection_mode == "By Engagement (heuristic)":
    # compute simple absence rate + lms activity
    try:
        temp_absence = attendance_df.groupby('StudentID')['Status'].apply(lambda x: (x == 'Absent').mean()).reset_index(name='AbsenceRate')
        temp_lms = lms_df.groupby('StudentID')[['SessionDuration', 'PagesViewed']].mean().reset_index()
        temp = pd.merge(temp_absence, temp_lms, on='StudentID', how='inner').dropna()
        ar_threshold = st.sidebar.slider("Max Absence Rate (include students with absence <=)", 0.0, 1.0, 0.2, 0.01)
        min_pages = st.sidebar.number_input("Min avg pages viewed", min_value=0.0, value=0.0, step=1.0)
        candidates = temp[(temp['AbsenceRate'] <= ar_threshold) & (temp['PagesViewed'] >= min_pages)]['StudentID'].tolist()
        selected_students = sorted(candidates)
    except Exception:
        st.sidebar.info("Not enough data to compute engagement-based selection")
        selected_students = []

elif selection_mode == "Top N Active":
    metric = st.sidebar.selectbox("Metric for activity", ["PagesViewed", "SessionDuration"]) if 'StudentID' in lms_df.columns else "PagesViewed"
    N = st.sidebar.slider("Top N students", 1, min(50, max(1, len(all_students))), min(10, max(1, len(all_students))))
    if not lms_df.empty and metric in lms_df.columns:
        agg = lms_df.groupby('StudentID')[[metric]].mean().reset_index()
        top_students = agg.sort_values(by=metric, ascending=False).head(N)['StudentID'].tolist()
        selected_students = sorted(top_students)
    else:
        st.sidebar.info("LMS data not available to compute Top N")
        selected_students = []

elif selection_mode == "Search":
    query = st.sidebar.text_input("Search StudentID (contains)")
    if query:
        selected_students = [s for s in all_students if query.lower() in str(s).lower()]
    else:
        selected_students = []

# Allow a final quick 'select all' override
if st.sidebar.checkbox("Select All (override)"):
    selected_students = all_students

# Ensure selected_students is a list and not empty
if not isinstance(selected_students, (list, np.ndarray)):
    selected_students = [selected_students] if pd.notna(selected_students) else []

# If nothing selected, fall back to all students to avoid empty displays
if not selected_students:
    selected_students = all_students

# End of enhanced selection block

# Date range filter
min_date = attendance_df['Date'].min()
max_date = attendance_df['Date'].max()
if pd.isna(min_date) or pd.isna(max_date):
    date_range = None
else:
    date_range = st.sidebar.date_input("Date range", value=(min_date.date(), max_date.date()))

# Filter datasets
if selected_students:
    filtered_attendance = attendance_df[attendance_df['StudentID'].isin(selected_students)].copy()
    filtered_events = events_df[events_df['StudentID'].isin(selected_students)].copy()
    filtered_lms = lms_df[lms_df['StudentID'].isin(selected_students)].copy()
else:
    filtered_attendance = attendance_df.copy()
    filtered_events = events_df.copy()
    filtered_lms = lms_df.copy()

if date_range and len(date_range) == 2:
    start, end = pd.to_datetime(date_range[0]), pd.to_datetime(date_range[1])
    filtered_attendance = filtered_attendance[(filtered_attendance['Date'] >= start) & (filtered_attendance['Date'] <= end)]
    filtered_events = filtered_events[(filtered_events['Date'] >= start) & (filtered_events['Date'] <= end)]
    if 'Date' in filtered_lms.columns:
        filtered_lms = filtered_lms[(filtered_lms['Date'] >= start) & (filtered_lms['Date'] <= end)]

# Main layout
col1, col2 = st.columns([2,1])

with col1:
    st.subheader("📋 Attendance Trends")
    if filtered_attendance.empty:
        st.info("No attendance records for the selection.")
    else:
        attendance_summary = filtered_attendance.groupby(['Date', 'Status']).size().unstack(fill_value=0)
        st.line_chart(attendance_summary)

    st.subheader("🎓 Event Participation")
    if filtered_events.empty:
        st.info("No event data for the selection.")
    else:
        event_counts = filtered_events['EventName'].value_counts()
        st.bar_chart(event_counts)

with col2:
    st.subheader("💻 LMS Usage Patterns (Average)")
    if filtered_lms.empty:
        st.info("No LMS usage data for the selection.")
    else:
        lms_summary = filtered_lms.groupby('StudentID')[['SessionDuration', 'PagesViewed']].mean()
        st.dataframe(lms_summary.style.format({"SessionDuration":"{:.2f}", "PagesViewed":"{:.1f}"}))

st.markdown("---")

st.subheader("🤖 Predict Student Engagement Risk")

# Build ML dataset from merged stats
try:
    absence_rate_df = attendance_df.groupby('StudentID')['Status'].apply(lambda x: (x == 'Absent').mean()).reset_index(name='AbsenceRate')
    lms_stats = lms_df.groupby('StudentID')[['SessionDuration', 'PagesViewed']].mean().reset_index()
    ml_data = pd.merge(absence_rate_df, lms_stats, on='StudentID', how='inner').dropna()

    # Engagement label: simple heuristic (can be improved)
    ml_data['Engagement'] = (ml_data['AbsenceRate'] < 0.2).astype(int)

    if ml_data.shape[0] < 2:
        st.warning("Not enough data to train a reliable model. Provide more students with both attendance and LMS usage.")
    else:
        X = ml_data[['AbsenceRate', 'SessionDuration', 'PagesViewed']]
        y = ml_data['Engagement']
        X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.25, random_state=42)
        model = DecisionTreeClassifier(random_state=42)
        model.fit(X_train, y_train)
        y_pred = model.predict(X_test)

        st.text("Model Performance (on test set):")
        report = classification_report(y_test, y_pred, zero_division=0)
        st.text(report)

        st.subheader("📈 Predict Engagement for New Student")
        absence_rate = st.number_input("Absence Rate (0 to 1)", min_value=0.0, max_value=1.0, value=0.1, step=0.01)
        session_duration = st.number_input("Average Session Duration (minutes)", min_value=0.0, value=30.0, step=1.0)
        pages_viewed = st.number_input("Average Pages Viewed", min_value=0.0, value=10.0, step=1.0)

        if st.button("Predict Engagement"):
            prediction = model.predict(np.array([[absence_rate, session_duration, pages_viewed]]))
            result = "Engaged" if prediction[0] == 1 else "At Risk"
            st.success(f"Predicted Engagement Status: {result}")

except Exception as e:
    st.error(f"Could not build training data / model: {e}")

st.markdown("---")

st.subheader("🛠️ Export & Next steps")
st.write("- To improve the model: include more features (assignments submitted, quiz scores), clean missing values, and try more classifiers.")
st.write("- To deploy: create a requirements.txt and deploy to Streamlit Cloud or any server with Python support.")

st.caption("App created for the Dell workshop: From Data to Decisions — modify heuristics and thresholds as needed.")
