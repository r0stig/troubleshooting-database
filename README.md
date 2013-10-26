Table schemas
CREATE TABLE questions(id integer primary key, question text, answer text, created integer, modified integer);
CREATE TABLE tags(id integer primary key, tag text, created integer);
CREATE TABLE questiontags(tagId integer, questionId integer);