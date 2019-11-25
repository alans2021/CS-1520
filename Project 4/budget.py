import json
from flask import Flask, request, session, url_for, redirect, render_template, abort, g, flash, _app_ctx_stack
from flask_restful import reqparse, abort, Api, Resource

app = Flask(__name__)
api = Api(app)
app.config['SECRET_KEY'] = 'assignment4'

CATEGORIES = {
    'Miscellaneous': None
}
PURCHASES = {}

purch_parser = reqparse.RequestParser()
purch_parser.add_argument('item')
purch_parser.add_argument('price')
purch_parser.add_argument('date')
purch_parser.add_argument('cat')

cat_parser = reqparse.RequestParser()
cat_parser.add_argument('cat')
cat_parser.add_argument('budget')


@app.route('/')
def init():
    return render_template('base.html')


def abort_if_category_doesnt_exist(category_id):
    if category_id not in CATEGORIES:
        return True


def abort_if_purchase_doesnt_exist(purchase_id, category_id):
    if category_id not in CATEGORIES:
        return True

    if purchase_id not in PURCHASES:
        return True


# PURCHASE
# shows the list of purchases and lets you add purchases with relevant data
class Purchases(Resource):
    def get(self):
        return PURCHASES

    def post(self):
        args = purch_parser.parse_args()
        category = args['cat']
        if abort_if_category_doesnt_exist(category):
            return {}, 201

        if args['item'] not in PURCHASES:
            PURCHASES[args['item']] = args
        obj = PURCHASES[args['item']]
        return obj, 201


# Categories
# shows a list of all todos, and lets you POST to add new tasks
class Categories(Resource):
    def get(self):
        return CATEGORIES

    def delete(self):
        args = cat_parser.parse_args()
        if abort_if_category_doesnt_exist(args['cat']):
            return '', 204
        del CATEGORIES[args['cat']]
        delete_list = []

        for purchase_key in PURCHASES:
            purchase = PURCHASES[purchase_key]
            if purchase['cat'] == args['cat']:
                delete_list.append(purchase_key)

        for key in delete_list:
            del PURCHASES[key]
        return '', 204

    def post(self):
        args = cat_parser.parse_args()
        if args['cat'] not in CATEGORIES:
            CATEGORIES[args['cat']] = args['budget']
        obj = {args['cat']: CATEGORIES[args['cat']]}
        return obj, 201


# Actually setup the Api resource routing here

api.add_resource(Categories, '/cats')
api.add_resource(Purchases, '/purchases')

