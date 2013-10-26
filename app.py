#!/usr/bin/env python
# Append module path
import os, sys
path = os.path.abspath(os.path.join(os.path.dirname(__file__), './modules'))
if not path in sys.path:
    sys.path.insert(1, path)
del path
import platform, dbal, time, json, ConfigParser
from flask import Flask, render_template, request, Response
from datetime import datetime

config = ConfigParser.ConfigParser()
path = os.path.abspath(os.path.join(os.path.dirname(__file__), './config'))
config.read(path + '/props.cfg')

subfolder = config.get('General', 'subfolder', 0)
app = Flask(__name__, static_path='/' + subfolder + '/static')
db = dbal.DBAL()

@app.route('/' + subfolder)
def index():
        return render_template('index.html')
                               
        ''', devices = db.get_devices(0), 
                events=db.get_events(), temp_sensor_data={}, 
                hum_sensor_data={}, dt=datetime)'''
            
@app.route('/' + subfolder + '/questions', methods=['GET'])
def fetch_questions():
    print "hej hej"
    print json.dumps(db.getQuestions())
    return Response(json.dumps(db.getQuestions()), mimetype='application/json')
    #return json.dumps(db.getQuestions())

@app.route('/' + subfolder + '/question', methods=['POST'])
def insert_question():
    return Response(json.dumps(db.insertQuestion(request.json['question'], request.json['answer'], request.json['tags'])), mimetype='application/json')
    

@app.route('/' + subfolder + '/question/<int:id>', methods=['PUT'])
def update_question(id = None):
    return Response(json.dumps(db.updateQuestion(id, request.json['question'], request.json['answer'], request.json['tags'])), mimetype='application/json')


#@app.route('/question', methods=['DELETE'])
#def remove_question():
#    db.removeQuestion(request.json.question, request.json.answer, request.json.tags)

if __name__ == "__main__":
        #application = app.wsgifunc()
        app.debug = True
        app.run(host='0.0.0.0')
