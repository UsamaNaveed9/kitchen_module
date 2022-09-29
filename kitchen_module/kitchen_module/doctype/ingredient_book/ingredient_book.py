# Copyright (c) 2022, SMB and contributors
# For license information, please see license.txt

from __future__ import unicode_literals
import frappe
from frappe.model.document import Document

class IngredientBook(Document):
	def before_submit(self):
		if not self.bom:
			bom = frappe.new_doc("BOM")
			bom.item = self.item_code
			bom.company = self.company
			ls = []
			for i in self.items:
				is_a_recipe = frappe.db.sql(''' select count(item_name) from `tabRecipe Book` where name = %s ''',i.item_code ,as_list = 1)[0][0]

				if(is_a_recipe):
					ls.extend(get_exploded_list(i.item_code,[]))
				else:
					ls_tmp = []
					ls_tmp.append(i.item_code)
					ls_tmp.append(i.qty)
					ls_tmp.append(i.uom)
					ls_tmp.append(i.is_mandatory)
					ls_tmp.append(i.yield_qty)
					ls_tmp.append(i.scrap)
					ls.append(ls_tmp)
			for i in ls:
				bom_item = frappe.new_doc("BOM Item")
				bom_item.item_code = i[0]
				bom_item.qty = i[1]
				bom_item.uom = i[2]
				bom_item.rate = '0'
				bom_item.yield_qty = i[4]
				bom_item.scrap = i[5]
				bom.append("items", bom_item)
			bom.save()
			bom.submit()
			self.bom = bom.name

		if not self.uom_added:
			if self.additional_uom:
				item = frappe.get_doc('Item', self.item_code)
				item_uom = frappe.new_doc("UOM Conversion Detail")
				item_uom.uom = self.additional_uom
				item_uom.conversion_factor = self.quantity
				item.append("uoms", item_uom)
				item.save()
				self.uom_added = "added"
		else:
			if self.additional_uom:
				item = frappe.get_doc('Item', self.item_code)
				for i in item.uoms:
					if i.uom == self.additional_uom:
						i.conversion_factor = self.quantity
				item.save()


	def before_cancel(self):
		if self.bom:
			bom = frappe.get_doc('BOM', self.bom)
			bom.is_active = 0
			bom.is_default = 0
			bom.save()
			self.bom = "" 


@frappe.whitelist(allow_guest = True)
def get_exploded_list(item, exp_list):
	recipe_list = frappe.db.sql("""select rbi.item_code, rbi.qty, rbi.uom, rbi.is_mandatory, rbi.yield_qty, rbi.scrap from `tabRecipe Book Items` as rbi inner join `tabRecipe Book` as recipe on recipe.name = rbi.parent where recipe.item = %s""",item, as_list = 1)
	for i in recipe_list:
		is_a_recipe = frappe.db.sql(''' select count(item_name) from `tabRecipe Book` where name = %s ''',i[0] ,as_list = 1)[0][0]
		if(is_a_recipe):
			get_exploded_list(i[0] , exp_list)
		else:
			exp_list.append(i)
	return exp_list