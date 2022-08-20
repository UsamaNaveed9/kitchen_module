# Copyright (c) 2022, SMB and contributors
# For license information, please see license.txt

import frappe
from frappe.model.document import Document

class MealProcess(Document):
	def before_save(self):
		for i in self.main_items:
			cost = 0
			for j in self.recipe_items:
				if i.item_code == j.parent_item and i.reference_doc == j.reference_doc:
					if i.qty > 1:
						j.qty = j.qty * i.qty
						j.amount = j.qty * j.rate
						cost = cost + j.amount
					else:
						cost = cost + j.amount	
			i.cost = cost

	def on_submit(self):
		se = frappe.new_doc("Stock Entry")
		se.stock_entry_type = "Manufacture"
		se.meal_process = self.name
		for i in self.recipe_items:
			se_item = frappe.new_doc("Stock Entry Detail")
			se_item.s_warehouse = self.source_warehouse
			se_item.item_code = i.item_code
			se_item.qty = i.qty
			se_item.basic_rate = i.rate
			se.append("items", se_item)

		for i in self.main_items:
			se_item = frappe.new_doc("Stock Entry Detail")
			se_item.t_warehouse = self.target_warehouse
			se_item.item_code = i.item_code
			se_item.qty = i.qty
			se_item.basic_rate = i.cost
			se.append("items", se_item)

		se.save()
		se.submit()		

