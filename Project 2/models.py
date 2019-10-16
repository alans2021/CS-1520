from flask_sqlalchemy import SQLAlchemy
from sqlalchemy import or_
from sqlalchemy import and_
from sqlalchemy import not_

db = SQLAlchemy()

class Staff(db.Model):
    __tablename__ = 'staff'
    staff_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(24), nullable=False)
    pw_hash = db.Column(db.String(64), nullable=False)

    def __init__(self, username, password):
        self.username = username
        self.pw_hash = password

    def __repr__(self):
        return '<Staff {}>'.format(self.username)


class Customer(db.Model):
    __tablename__ = 'customer'
    customer_id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(24), nullable=False)
    pw_hash = db.Column(db.String(64), nullable=False)

    def __init__(self, user, passw):
        self.username = user
        self.pw_hash = passw

    def __repr__(self):
        return '<Customer {}>'.format(self.username)


class EventsWorking(db.Model):
    __tablename__ = 'events_working'
    event_id = db.Column(db.Integer, primary_key=True)
    event_name = db.Column(db.String(64), nullable=False)
    event_date = db.Column(db.Date, nullable=False)
    cust_id = db.Column(db.Integer, nullable=False)
    staff_id1 = db.Column(db.Integer, nullable=False)
    staff_id2 = db.Column(db.Integer, nullable=False)
    staff_id3 = db.Column(db.Integer, nullable=False)

    def __init__(self, name, date, cust):
        self.event_name = name
        self.event_date = date
        self.cust_id = cust
        self.staff_id1 = 0
        self.staff_id2 = 0
        self.staff_id3 = 0

    def __repr__(self):
        return '<Events Working {}>'.format(self.event_name)



