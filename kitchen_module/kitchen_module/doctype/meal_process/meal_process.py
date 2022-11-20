# Copyright (c) 2022, SMB and contributors
# For license information, please see license.txt

import frappe
import json
from frappe import _, msgprint
from frappe.model.document import Document

class MealProcess(Document):
	def before_save(self):
		if self.get_items_from == "Sales Order":
			for i in self.main_items:
				cost = 0
				for j in self.recipe_items:
					if i.item_code == j.parent_item and i.sales_order_ref == j.sales_order_ref:
						if i.qty > 1:
							j.qty = j.qty * i.qty
							if j.rate:
								j.amount = j.qty * j.rate
								cost = cost + j.amount
						else:
							if j.amount:
								cost = cost + j.amount	
				i.cost = cost
				
		elif self.get_items_from == "Material Request":
			for i in self.main_items:
				cost = 0
				for j in self.recipe_items:
					if i.item_code == j.parent_item and i.material_request_ref == j.material_request_ref:
						if i.qty > 1:
							j.qty = j.qty * i.qty
							if j.rate:
								j.amount = j.qty * j.rate
								cost = cost + j.amount
						else:
							if j.amount:
								cost = cost + j.amount	
				i.cost = cost
				

	def on_submit(self):
		if self.get_items_from == "Sales Order":
			for i in self.main_items:
				se = frappe.new_doc("Stock Entry")
				se.stock_entry_type = "Manufacture"
				se.meal_process = self.name
				se.from_bom = 1
				se.from_warehouse = self.source_warehouse
				se.to_warehouse = self.target_warehouse
				for j in self.bom_list:
					if i.item_code == j.main_item and i.sales_order_ref == j.sales_order_ref:
						se.bom_no = j.bom
				se.fg_completed_qty = i.qty

				for k in self.recipe_items:
					if i.item_code == k.parent_item and i.sales_order_ref == k.sales_order_ref:
						se_item = frappe.new_doc("Stock Entry Detail")
						se_item.s_warehouse = self.source_warehouse
						se_item.item_code = k.item_code
						se_item.qty = k.qty
						se_item.basic_rate = k.rate
						if i.rate == 0:
							se_item.allow_zero_valuation_rate = 1
						se.append("items", se_item)

				se_item = frappe.new_doc("Stock Entry Detail")
				se_item.t_warehouse = self.target_warehouse
				se_item.item_code = i.item_code
				se_item.is_finished_item = 1
				se_item.qty = i.qty
				se_item.basic_rate = i.cost/i.qty
				se.append("items", se_item)		

				se.save()
				se.submit()

		elif self.get_items_from == "Material Request":	
			for i in self.main_items:
				se = frappe.new_doc("Stock Entry")
				se.stock_entry_type = "Manufacture"
				se.meal_process = self.name
				se.from_bom = 1
				se.from_warehouse = self.source_warehouse
				se.to_warehouse = self.target_warehouse
				for j in self.bom_list:
					if i.item_code == j.main_item and i.material_request_ref == j.material_request_ref:
						se.bom_no = j.bom
				se.fg_completed_qty = i.qty

				for k in self.recipe_items:
					if i.item_code == k.parent_item and i.material_request_ref == k.material_request_ref:
						se_item = frappe.new_doc("Stock Entry Detail")
						se_item.s_warehouse = self.source_warehouse
						se_item.item_code = k.item_code
						se_item.qty = k.qty
						se_item.basic_rate = k.rate
						if i.rate == 0:
							se_item.allow_zero_valuation_rate = 1
						se.append("items", se_item)

				se_item = frappe.new_doc("Stock Entry Detail")
				se_item.t_warehouse = self.target_warehouse
				se_item.item_code = i.item_code
				se_item.is_finished_item = 1
				se_item.qty = i.qty
				se_item.uom = i.uom
				se_item.basic_rate = i.cost/i.qty
				se.append("items", se_item)		

				se.save()
				se.submit()

	def submit(self):
		if len(self.main_items) > 5:
			msgprint(_("The task has been enqueued as a background job. In case there is any issue on processing in background, the system will add a comment about the error on this Meal Process and revert to the Draft stage"))
			self.queue_action('submit', timeout=3000)
		else:
			self._submit()

@frappe.whitelist()
def sales_order_get_items(sales_orders,source_warehouse):
	sales_order = json.loads(sales_orders)
	main_items = []
	for so in sales_order:
		so_items = frappe.db.sql('''select item_code,item_name,qty,uom,rate,amount,parent from `tabSales Order Item` 
							where `tabSales Order Item`.parent = "{0}"'''.format(so),as_dict = 1)
		for soi in so_items:					
			main_items.append(soi)					

	bom = {}
	boms = []
	recipe_item = {}
	recipe_items = []

	for item in main_items:
		bom['bom_name'] = frappe.db.get_value("BOM", {"item": item.item_code, "is_default": 1}, "name")
		bom['total_cost'] = frappe.db.get_value("BOM", {"item": item.item_code, "is_default": 1}, "total_cost")
		bom['main_item'] = item.item_code
		bom['sales_order'] = item.parent					

		bom_copy = bom.copy()
		boms.append(bom_copy)

		if bom['bom_name']:
			bom_doc = frappe.get_doc('BOM', bom['bom_name'])
			bom_doc_items = bom_doc.items
			for re_item in bom_doc_items:
				recipe_item['item_code'] = re_item.item_code
				recipe_item['item_name'] = re_item.item_name
				recipe_item['qty'] = re_item.qty
				recipe_item['uom'] = re_item.uom
				recipe_item['available_qty'] = frappe.db.get_value("Bin", {"item_code":re_item.item_code, "warehouse":source_warehouse}, "actual_qty")
				recipe_item['rate'] = frappe.db.get_value("Bin", {"item_code":re_item.item_code, "warehouse":source_warehouse}, "valuation_rate")
				recipe_item['amount'] = recipe_item['qty'] * recipe_item['rate']
				recipe_item['parent_item'] = item.item_code
				recipe_item['bom'] = re_item.parent
				recipe_item['sales_order'] = item.parent

				recipe_item_copy = recipe_item.copy()
				recipe_items.append(recipe_item_copy)

	
	return main_items,boms,recipe_items


@frappe.whitelist()
def material_request_get_items(material_requests,source_warehouse):
	material_request = json.loads(material_requests)
	main_items = []
	for mr in material_request:
		mr_items = frappe.db.sql('''select item_code,item_name,qty,uom,rate,amount,parent from `tabMaterial Request Item` 
							where `tabMaterial Request Item`.parent = "{0}"'''.format(mr),as_dict = 1)
		for mri in mr_items:					
			main_items.append(mri)					

	bom = {}
	boms = []
	recipe_item = {}
	recipe_items = []

	for item in main_items:
		bom['bom_name'] = frappe.db.get_value("BOM", {"item": item.item_code, "is_default": 1}, "name")
		bom['total_cost'] = frappe.db.get_value("BOM", {"item": item.item_code, "is_default": 1}, "total_cost")
		bom['main_item'] = item.item_code
		bom['material_request'] = item.parent					

		bom_copy = bom.copy()
		boms.append(bom_copy)

		if bom['bom_name']:
			bom_doc = frappe.get_doc('BOM', bom['bom_name'])
			bom_doc_items = bom_doc.items
			for re_item in bom_doc_items:
				recipe_item['item_code'] = re_item.item_code
				recipe_item['item_name'] = re_item.item_name
				recipe_item['qty'] = re_item.qty
				recipe_item['uom'] = re_item.uom
				recipe_item['available_qty'] = frappe.db.get_value("Bin", {"item_code":re_item.item_code, "warehouse":source_warehouse}, "actual_qty")
				recipe_item['rate'] = frappe.db.get_value("Bin", {"item_code":re_item.item_code, "warehouse":source_warehouse}, "valuation_rate")
				recipe_item['amount'] = recipe_item['qty'] * recipe_item['rate']
				recipe_item['parent_item'] = item.item_code
				recipe_item['bom'] = re_item.parent
				recipe_item['material_request'] = item.parent

				recipe_item_copy = recipe_item.copy()
				recipe_items.append(recipe_item_copy)

	
	return main_items,boms,recipe_items


