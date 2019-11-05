import time
import os
import json
from hashlib import md5
from datetime import datetime
from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash, _app_ctx_stack
from models import db, User, Chatroom, Message
from werkzeug.security import check_password_hash, generate_password_hash


app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'chat.db')
app.config['SECRET_KEY'] = 'assignment3'
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False

db.init_app(app)


def get_chatrooms(owner=None):
    if owner is None:
        rooms = Chatroom.query.all()
    else:
        rooms = Chatroom.query.filter_by(owner_id=owner).all()

    if len(rooms) == 0:
        return None
    else:
        return rooms


def get_messages_from_room(room_id):
    msgs = Message.query.filter_by(chatroom_id=room_id).order_by(Message.text_date).all()
    if len(msgs) == 0:
        return None
    else:
        return msgs


def get_room_from_id(room_id):
    room = Chatroom.query.filter_by(room_id=room_id).first()
    return room.name if room else None


def get_user_from_id(id):
    result = User.query.filter_by(user_id=id).first()
    return result.username if result else None


def get_id_from_user(name):
    result = User.query.filter_by(username=name).first()
    return result.user_id if result else None


@app.cli.command('initdb')
def initdb_command():
    """Creates the database tables."""
    db.create_all()
    print('Initialized the database.')


@app.route('/')
def init():
    try:  # Check to see if session['id'] set.
        session['id']
    except KeyError:  # If not, set it to None
        session['id'] = None

    return redirect(url_for('login'))


@app.route('/register', methods=['GET', 'POST'])
def register():
    if session['id'] is not None:
        return redirect(url_for('login'))

    error = None
    if request.method == 'POST':
        user = request.form['username']
        passw = request.form['password']
        confirm = request.form['confirm']
        if passw != confirm:
            error = "Passwords don't match"
        else:
            same_users = User.query.filter_by(username=user).first()
            if same_users is not None:
                error = "Username already in use"
            else:
                newUser = User(user, generate_password_hash(passw))
                db.session.add(newUser)
                db.session.commit()
                flash('New user account successfully created!')
                return redirect(url_for('login'))

    return render_template('register.html', error=error)


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None
    if session['id'] is not None:
        return redirect(url_for('user', name=session['id']))

    if request.method == 'POST':
        user = request.form['username']
        password = request.form['password']
        matched_user = User.query.filter_by(username=user).first()
        if matched_user is not None:
            if check_password_hash(matched_user.pw_hash, password):
                session['id'] = user
                return redirect(url_for('user', name=user))
            else:
                error = 'Invalid Login'
        else:
            error = 'Invalid Login'

    return render_template('login.html', error=error)


@app.route('/user/<name>', methods=['GET', 'POST'])
def user(name):
    if session['id'] is None:
        abort(401)
    elif session['id'] != name:
        abort(401)

    try:
        if session['deleted'] is True:
            flash("Chatroom has been deleted! You have been redirected to user page")
    except KeyError:
        session['deleted'] = False

    session['deleted'] = False
    session['room'] = None
    session['num_messages'] = 0

    if request.method == 'POST':
        new_room = request.form['chatname']
        newChat = Chatroom(new_room, get_id_from_user(name))
        db.session.add(newChat)
        db.session.commit()

    # new_messages.clear()
    rooms = None
    owned = None
    raw_data = get_chatrooms()
    if raw_data is not None:
        owned = get_chatrooms(get_id_from_user(session['id']))
        rooms = []
        for data in raw_data:
            room = [data.room_id, data.name, get_user_from_id(data.owner_id)]
            rooms.append(room)

    return render_template('user.html', name=name, rooms=rooms, delete=owned)


@app.route('/chat_room/<room>/<name>', methods=['GET', 'POST'])
def chat_room(room, name):
    if name != session['id']:
        abort(401)
    if session['room'] is not None and session['room'] != room:
        abort(401)

    session['room'] = room
    messages = get_messages_from_room(room)

    if messages is not None:
        session['num_messages'] = len(messages)
        for i in range(0, len(messages)):
            messages[i] = [messages[i].text, messages[i].text_date, get_user_from_id(messages[i].author_id)]
    else:
        session['num_messages'] = 0
    room_name = get_room_from_id(room)
    return render_template('chatroom.html', messages=messages, name=name, room=room_name)


@app.route('/delete_room/<room>/<name>', methods=['POST'])
def delete_room(room, name):
    Message.query.filter_by(chatroom_id=room).delete()
    Chatroom.query.filter_by(room_id=room).delete()
    db.session.commit()
    return redirect(url_for('user', name=name))


@app.route("/new_message", methods=["POST"])
def add():
    name = get_id_from_user(session['id'])
    text = request.form['msg']
    date = datetime.strptime(request.form['date'], "%Y-%m-%d %H:%M:%S")
    room = session['room']

    newMsg = Message(text, date, name, room)
    db.session.add(newMsg)
    db.session.commit()
    session['num_messages'] += 1
    return "OK!"


@app.route("/messages")
def get_msgs():
    room = Chatroom.query.filter_by(room_id=session['room']).first()
    if room is None:  # Check to see if chatroom still exists
        session['deleted'] = True
        return json.dumps(None)

    msgs = get_messages_from_room(session['room'])
    if msgs is None:
        return json.dumps([])

    msgs = msgs[session['num_messages']:]
    for i in range(0, len(msgs)):
        name = get_user_from_id(msgs[i].author_id)
        msgs[i] = [name + ": ", msgs[i].text, str(msgs[i].text_date)]
    session['num_messages'] += len(msgs)
    return json.dumps(msgs)


@app.route('/logout')
def logout():
    flash('You were logged out')
    session['id'] = None
    return redirect(url_for('login'))
