import time
import os
from hashlib import md5
from datetime import datetime
from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash, _app_ctx_stack
from models import db, Customer, Staff, EventsWorking, or_, and_
from werkzeug.security import check_password_hash, generate_password_hash

app = Flask(__name__)
app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///' + os.path.join(app.root_path, 'catering.db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False  #here to silence deprecation warning
app.config['SECRET_KEY'] = 'assignment2'

db.init_app(app)

# Owner credentials
owner_user = 'owner'
owner_pass = 'pass'


@app.cli.command('initdb')
def initdb_command():
    """Creates the database tables."""
    db.create_all()
    print('Initialized the database.')


def get_user_id(staffname):
    rv = Staff.query.filter_by(username=staffname).first()
    return rv.staff_id if rv else None


def get_staff_name(id):
    rv = Staff.query.filter_by(staff_id=id).first()
    return rv.username if rv else None


def get_event(id):
    event = EventsWorking.query.filter_by(event_id=id).first()
    return event if event else None


@app.route('/')
def init():
    try:
        if session['id'] is None:
            return redirect(url_for('login'))
        elif session['id'] == 'owner':
            return redirect(url_for('owner_page'))
    except KeyError:
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
        elif user == owner_user and passw == owner_pass:  # Same credentials as owner
            error = "Username or Password already in use"
        else:
            staff = Staff.query.filter_by(username=user).first()
            cust = Customer.query.filter_by(username=user).first()

            if staff is not None and check_password_hash(staff.pw_hash, passw):  # Same credentials as a staff member
                error = "Username or Password already in use"
            elif cust is not None and check_password_hash(cust.pw_hash, passw):  # Same credentials for customer
                error = "Username or Password already in use"
            else:
                newCust = Customer(user, generate_password_hash(passw))
                db.session.add(newCust)
                db.session.commit()
                flash('New Customer account successfully created')
                return redirect(url_for('login'))

    return render_template('register.html', error=error)


@app.route('/login', methods=['GET', 'POST'])
def login():
    error = None

    if session['id'] is not None:
        if session['id'] == 'owner':
            return redirect(url_for('owner_page'))
        elif session['id'].find('staff') == 0:
            return redirect(url_for('staff'))
        elif session['id'].find('cust') == 0:
            return redirect(url_for('customer'))

    if request.method == 'POST':
        user = request.form['username']
        password = request.form['password']

        staffs = Staff.query.filter_by(username=user).all()
        customers = Customer.query.filter_by(username=user).all()
        if user == owner_user and password == owner_pass:
            flash('Owner logged in')
            session['id'] = 'owner'
            return redirect(url_for('owner_page'))
        elif len(staffs) > 0:
            for staff in staffs:
                staff_pass = staff.pw_hash
                if check_password_hash(staff_pass, password):
                    flash(user + ' logged in')
                    session['id'] = 'staff' + user
                    session['num'] = staff.staff_id
                    return redirect(url_for('staff_page', name=user))
        elif len(customers) > 0:
            for cust in customers:
                cust_pass = cust.pw_hash
                if check_password_hash(cust_pass, password):
                    flash(user + ' logged in')
                    session['id'] = 'cust' + user
                    session['num'] = cust.customer_id
                    return redirect(url_for('customer_page', name=user))
        else:
            error = 'Invalid login'

    return render_template('login.html', error=error)


@app.route('/owner')
def owner_page():
    if session['id'] is None or session['id'] != 'owner':
        abort(401)
    queries = EventsWorking.query.order_by(EventsWorking.event_date.desc()).with_entities(EventsWorking.event_name,
                                                                                         EventsWorking.event_date,
                                                                                         EventsWorking.staff_id1,
                                                                                         EventsWorking.staff_id2,
                                                                                         EventsWorking.staff_id3)
    events = []
    for entry in queries:
        event = []
        for thing in entry:
            event.append(thing)
        if event[2] == 0:
            event[2] = None
        elif event[3] == 0:
            event[2] = get_staff_name(event[2])
        elif event[4] == 0:
            event[2] = get_staff_name(event[2]) + ", " + get_staff_name(event[3])
        else:
            event[2] = get_staff_name(event[2]) + ", " + get_staff_name(event[3]) + ", " + get_staff_name(event[4])
        event = event[0: 3]
        events.append(event)

    return render_template('owner.html', events=events)


@app.route('/staff')
def staff():
    if session['id'] is None or session['id'].find('staff') == -1:
        abort(401)
    else:
        return redirect(url_for('staff_page', name=session['id'][5:]))


@app.route('/customer')
def customer():
    if session['id'] is None or session['id'].find('cust') == -1:
        abort(401)
    else:
        return redirect(url_for('customer_page', name=session['id'][4:]))


@app.route('/staff/<name>', methods=['GET', 'POST'])
def staff_page(name):
    if session['id'] is None or session['id'] != 'staff' + name:
        abort(401)
    session['id'] = 'staff' + name
    staff_id = session['num']
    filter_rule = or_(EventsWorking.staff_id1 == staff_id, EventsWorking.staff_id2 == staff_id,
                      EventsWorking.staff_id3 == staff_id)
    working = EventsWorking.query.filter(filter_rule).with_entities(EventsWorking.event_id,
                                                                    EventsWorking.event_name,
                                                                    EventsWorking.event_date)

    filter1 = and_(EventsWorking.staff_id1 != staff_id, EventsWorking.staff_id2 != staff_id,
                   EventsWorking.staff_id3 == 0)
    can_schedule = EventsWorking.query.filter(filter1).with_entities(EventsWorking.event_id,
                                                                     EventsWorking.event_name,
                                                                     EventsWorking.event_date)
    return render_template('staff.html', name=name, current=working, future=can_schedule)


@app.route('/customer/<name>', methods=['GET', 'POST'])
def customer_page(name):
    if session['id'] is None or session['id'] != 'cust' + name:
        abort(401)
    session['id'] = 'cust' + name
    customer_id = session['num']

    events_requested = EventsWorking.query.filter(EventsWorking.cust_id == customer_id).\
        with_entities(EventsWorking.event_id, EventsWorking.event_name, EventsWorking.event_date)
    return render_template('customer.html', name=name, id=customer_id, current=events_requested)


@app.route('/add_staff', methods=['POST'])
def add_staff():
    if session['id'] is None or session['id'] != 'owner':
        abort(401)

    if request.form['name'] and request.form['password']:
        sameID = get_user_id(request.form['name'])
        if sameID is not None:
            fullStaff = Staff.query.filter_by(staff_id=sameID).first()
            if check_password_hash(fullStaff.pw_hash, request.form['password']):
                flash('Staff member with same name and password already exist')
                return redirect(url_for('owner_page'))
        newStaff = Staff(request.form['name'], generate_password_hash(request.form['password']))
        db.session.add(newStaff)
        db.session.commit()
        flash('New Staff account successfully created')
    else:
        flash('Both name and password fields must be filled')
    return redirect(url_for('owner_page'))


@app.route('/add_event/<event>/<name>', methods=['POST'])
def add_event(event, name):
    if session['id'] is None or session['id'].find('staff') == -1:
        abort(401)

    staff_name = session['id'][5:]
    if staff_name != name:
        abort(401)

    new_event = get_event(event)
    staff_id = get_user_id(staff_name)

    if new_event is not None and staff_id is not None:
        if new_event.staff_id1 == 0:
            new_event.staff_id1 = staff_id
        elif new_event.staff_id2 == 0:
            new_event.staff_id2 = staff_id
        elif new_event.staff_id3 == 0:
            new_event.staff_id3 = staff_id
        db.session.commit()

    return redirect(url_for('staff_page', name=session['id'][5:]))


@app.route('/request_event/<id>', methods=['POST'])
def request_event(id):
    if session['id'] is None or session['id'].find('cust') == -1:
        abort(401)

    cust_id = session['num']
    if str(cust_id) != id:
        abort(401)

    event = request.form['name']
    date = request.form['date']
    if event and date:
        if EventsWorking.query.filter_by(event_date=date).first() is not None:
            flash('Company already booked for the date of ' + str(date))
        else:
            date = datetime.strptime(date, '%Y-%m-%d')
            newEvent = EventsWorking(event, date, cust_id)
            db.session.add(newEvent)
            db.session.commit()
            flash('New event successfully registered!')
    else:
        flash('Please fill both fields')
    return redirect(url_for('customer_page', name=session['id'][4:]))


@app.route('/cancel_event/<event_id>', methods=['POST'])
def cancel_event(event_id):
    if session['id'] is None or session['id'].find('cust') == -1:
        abort(401)

    EventsWorking.query.filter_by(event_id=event_id).delete()
    db.session.commit()
    return redirect(url_for('customer_page', name=session['id'][4:]))

@app.route('/logout')
def logout():
    flash('You were logged out')
    session['id'] = None
    session['num'] = None
    return redirect(url_for('login'))
