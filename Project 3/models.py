from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()


class User(db.Model):
    __tablename__ = 'user'
    user_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(24), nullable=False)
    pw_hash = db.Column(db.String(64), nullable=False)
    chatrooms = db.relationship('Chatroom', backref='user', lazy=True)
    messages = db.relationship('Message', backref='user', lazy=True)

    def __init__(self, username, password):
        self.username = username
        self.pw_hash = password

    def __repr__(self):
        return '<User {}>'.format(self.username)


class Chatroom(db.Model):
    __tablename__ = 'chatroom'
    room_id = db.Column(db.Integer, primary_key=True)
    name = db.Column(db.String(35), nullable=False)
    owner_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    messages = db.relationship('Message', backref='chatroom', lazy=True)

    def __init__(self, room, user):
        self.name = room
        self.owner_id = user


class Message(db.Model):
    __tablename__ = 'message'
    message_id = db.Column(db.Integer, primary_key=True)
    text = db.Column(db.String(200), nullable=False)
    text_date = db.Column(db.DateTime, nullable=False)
    author_id = db.Column(db.Integer, db.ForeignKey('user.user_id'), nullable=False)
    chatroom_id = db.Column(db.Integer, db.ForeignKey('chatroom.room_id'), nullable=False)

    def __init__(self, msg, msg_time, user, room):
        self.text = msg
        self.text_date = msg_time
        self.author_id = user
        self.chatroom_id = room



