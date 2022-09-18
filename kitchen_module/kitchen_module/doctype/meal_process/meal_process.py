# Copyright (c) 2022, SMB and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class MealProcess(Document):
	def before_save(self):
		if self.get_items_from == "Sales Order":
			for i in self.main_items:
				cost = 0
				for j in self.recipe_items:
					if i.item_code == j.parent_item and i.seles_order_ref == j.sales_order_ref:
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
				

	def before_submit(self):
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
				se_item.basic_rate = i.cost/i.qty
				se.append("items", se_item)		

				se.save()
				se.submit()
