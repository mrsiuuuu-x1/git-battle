from flask import FLask, render_template, request, jsonify
import requests
import os
from dotenv import load_dotenv

load_dotenv()

app = Flask(__name__)

GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")

HEADERS = {"Authorization": f"token {GITHUB_TOKEN}"} if GITHUB_TOKEN else {}

def get_github_stats(username):
    """Fetch user data from GitHub API"""
    url = f"https://api.github.com/users/{username}"
    try:
        # Now we use the secure HEADERS variable defined above
        response = requests.get(url, headers=HEADERS)
        if response.status_code == 200:
            return response.json()
        elif response.status_code == 403:
            print(f"Error: Rate limit exceeded or bad token.")
        elif response.status_code == 404:
            print(f"Error: User {username} not found.")
    except Exception as e:
        print(f"Error fetching {username}: {e}")
    return None

@app.route('/')
def home():
    return render_template('index.html')

@app.route('/battle', methods['POST'])
def battle():
    data = request.json
    p1_name = data.get('p1')
    p2_name = data.get('p2')
    if not p1_name or not p2_name:
        return jsonify({"error": "Both usernames are required"}), 400
    
    stats1 = get_github_stats(p1_name)
    stats2 = get_github_stats(p2_name)

    if not stats1 or stats2:
        return jsonify({"error": "User not found. Check spelling"}), 404
    
    # MAIN LOGIC
    winner = None
    if stats1['followers'] > stats2['followers']:
        winner = stats1['login']
    elif stats2['followers'] > stats1['followers']:
        winner = stats2['login']
    else:
        winner = "Draw"
    
    return jsonify({
        "p1" : stats1,
        "p2" : stats2,
        "winner" : winner
    })

if __name__ == '__main__':
    print("Git Battle running at http://127.0.0.1:5000")
    app.run(debug=True)