// Copyright (c) 2022, SMB and contributors
// For license information, please see license.txt

frappe.ui.form.on('Recipe Book', {
	refresh: function(frm) {
		frm.set_query("item_code", function(){
				return{
						filters:{
								has_recipe: 1
						}
				}
		})
	},
	item_code: function(frm){
		if(frm.doc.item_code){
			frappe.db.get_value("Item Price", {"item_code":frm.doc.item_code, "selling":1}, "price_list_rate").then((r)=>{
				if(r.message.price_list_rate){
					let price = r.message.price_list_rate;
					//console.log(price);
					frm.set_value("item_price", price)
					frm.refresh();
				}
			})
		}
	}
});
frappe.ui.form.on("Recipe Book Items", {
	item_code:function(frm, cdt, cdn){
			let row = locals[cdt][cdn];
			if(row.item_code){
					frappe.db.get_value("Bin", {"item_code":row.item_code}, "valuation_rate").then((r)=>{
							if(r.message.valuation_rate){
									let price = 0;
									if(r.message.valuation_rate){
											price = r.message.valuation_rate
									}
									row.rate = price;
									row.amount = row.qty * price
									let total = 0
									for(let i in frm.doc.items){
											total += frm.doc.items[i].amount
									}
									frm.set_value("total_amount", total)
									frm.refresh();
							}
					})
			}
	},
	qty:function(frm, cdt, cdn){
			frm.script_manager.trigger('item_code', cdt, cdn)
	},
	scrap: function (frm, cdt, cdn) {
		var index = 0;
		for (var i in frm.doc.items) {
				if (frm.doc.items[i].name == cdn) {
						index = i;
						break;
				}
		}
		if (frm.doc.items[index].yield_qty) {
				frm.doc.items[index].qty = ((frm.doc.items[index].yield_qty * 100) / (100 - frm.doc.items[index].scrap)).toFixed(0)
		}
		frm.refresh_field("items")
	},
	yield_qty: function (frm, cdt, cdn) {
		var index = 0;
		for (var i in frm.doc.items) {
				if (frm.doc.items[i].name == cdn) {
						index = i;
						break;
				}
		}
		if (frm.doc.items[index].scrap) {
			frm.doc.items[index].qty = ((frm.doc.items[index].yield_qty * 100) / (100 - frm.doc.items[index].scrap)).toFixed(0)
		}
		frm.refresh_field("items")
}
})
