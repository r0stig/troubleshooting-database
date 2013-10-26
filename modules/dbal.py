import sqlite3, calendar, time, ConfigParser, os, sys, calendar
from datetime import timedelta, datetime

config = ConfigParser.ConfigParser()
path = os.path.abspath(os.path.join(os.path.dirname(__file__), '../config'))
config.read(path + '/props.cfg')

class DBAL():
    def __init__(self):
        self.conn = sqlite3.connect(config.get('General', 'database_path', 0), check_same_thread=False)
        
    def getTagsByQuestionId(self, qId):
        retList = []
        tags = []
        cursor = self.conn.cursor()
        with self.conn:
            res = cursor.execute('SELECT tags.tag FROM questiontags INNER JOIN questions ON questions.id = questiontags.questionId INNER JOIN tags ON tags.id = questiontags.tagId WHERE questiontags.questionId = ? ORDER BY tags.tag ASC', (qId,))
            tags = res.fetchall()
        
        # Convert to dictionary data
        for tag in tags:
            t = {}
            t['tag'] = tags[0]
            retList.append(t)
        return tags
    
    def getQuestions(self):
        retList = []
        questions = []
        cursor = self.conn.cursor()
        with self.conn:
            res = cursor.execute('SELECT questions.id, questions.question, questions.answer, questions.created, questions.modified FROM questions')
            questions = res.fetchall()
        
        for q in questions:
            t = {}
            t['id'] = q[0]
            t['question'] = q[1]
            t['answer'] = q[2]
            t['created'] = q[3]
            t['modified'] = q[4]
            t['tags'] = self.getTagsByQuestionId(q[0])
            retList.append(t)
            
        return retList
    
    def getQuestion(self, id):
        retObj = {}
        question = {}
        cursor = self.conn.cursor()
        with self.conn:
            res = cursor.execute('SELECT questions.id, questions.question, questions.answer, questions.created, questions.modified FROM questions WHERE questions.id = ?', (id,))
            question = res.fetchone()
        
        retObj['id'] = question[0]
        retObj['question'] = question[1]
        retObj['answer'] = question[2]
        retObj['created'] = question[3]
        retObj['modified'] = question[4]
        retObj['tags'] = self.getTagsByQuestionId(question[0])
            
        return retObj
                                 
    def insertQuestion(self, question, answer, tags):
        retObj = {}
        id = -1
        today = ''
        cursor = self.conn.cursor()
        with self.conn:
            cursor.execute('INSERT INTO questions(question, answer, created) VALUES(?,?,?)',
                           (question, answer, today))
            id = cursor.lastrowid
        for tag in tags:
            self.insertTag(tag, id)
        
        return self.getQuestion(id)
                               
    def insertTag(self, tag, qId):
        cursor = self.conn.cursor()
        id = -1
        now = datetime.now()
        today = now.strftime("%Y-%m-%d %H:%M")
        # Does the tag already exist?
        with self.conn:
            res = cursor.execute('SELECT id FROM tags WHERE tag = ?', (tag,))
            t = res.fetchone()
            # Tag doesn't exist, create it
            if t is None:
                cursor.execute('INSERT INTO tags(tag, created) VALUES(?,?)', (tag, today))
                id = cursor.lastrowid
            else:
                id = t[0]
                
            # Connect tag to question
            cursor.execute('INSERT INTO questiontags(tagId, questionId) VALUES(?,?)', (id, qId))
        
        return id
    
    def removeTagForQuestion(self, qId):
        cursor = self.conn.cursor()
        
        with self.conn:
            cursor.execute('DELETE FROM questiontags WHERE questionId = ?', (qId,))

    def updateQuestion(self, qId, question, answer, tags):
        cursor = self.conn.cursor()
        
        now = datetime.now()
        today = now.strftime("%Y-%m-%d %H:%M")
        
        with self.conn:
            cursor.execute('UPDATE questions SET question = ?, answer = ?, modified = ? WHERE id = ?', (question, answer, today, qId))
            
        self.removeTagForQuestion(qId)
        for tag in tags:
            self.insertTag(tag, qId)
            
        return self.getQuestion(qId)
    