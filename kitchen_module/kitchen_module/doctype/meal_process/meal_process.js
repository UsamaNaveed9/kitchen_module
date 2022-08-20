// Copyright (c) 2022, SMB and contributors
// For license information, please see license.txt

frappe.ui.form.on('Meal Process', {
	setup(frm) {
		frm.fields_dict['main_items'].grid.get_field("item_code").get_query = function(doc, cdt, cdn) {
	    return {
		    filters: [
			    ['Item', 'item_group', 'in',
				    'MAIN ITEM'],
		    ]
	    }
        }
	},
	get_sales_orders: function(frm){
		var f_date = cur_frm.doc.from_date;
		var t_date = cur_frm.doc.to_date;
		frappe.db.get_list('Sales Order', {
			fields: ['name','transaction_date','customer','grand_total'],
			filters: [["transaction_date","between",[f_date,t_date]]]
		}).then(records => {
			//console.log(records,records.length);
			if(records.length >=1 ){
				cur_frm.clear_table("sales_orders");
				for(var i=0;i<records.length;i++){
					var add = cur_frm.add_child("sales_orders");
					add.sales_order = records[i]["name"]
					add.sales_order_date = records[i]["transaction_date"]
					add.customer = records[i]["customer"]
					add.grand_total = records[i]["grand_total"]
					cur_frm.refresh_fields("sales_orders");
				}
			}
			else{
				frappe.msgprint(__('No records exist between these dates'));
			}
		})
	},
	get_material_requests: function(frm){
		var f_date = cur_frm.doc.from_date;
		var t_date = cur_frm.doc.to_date;
		frappe.db.get_list('Material Request', {
			fields: ['name','transaction_date'],
			filters: [["transaction_date","between",[f_date,t_date]]]
		}).then(records => {
			//console.log(records,records.length);
			if(records.length >=1 ){
				cur_frm.clear_table("material_requests");
				for(var i=0;i<records.length;i++){
					var add = cur_frm.add_child("material_requests");
					add.material_request = records[i]["name"]
					add.material_request_date = records[i]["transaction_date"]
					cur_frm.refresh_fields("material_requests");
				}
			}
			else{
				frappe.msgprint(__('No records exist between these dates'));
			}
		})
	},
	get_items: function(frm){
		if(cur_frm.doc.get_items_from == "Sales Order"){
			let sales_orders = cur_frm.doc.sales_orders;
			for(let s=0; s<sales_orders.length; s++){
			frappe.db.get_doc('Sales Order', sales_orders[s].sales_order)
    			.then(d => {
        				//console.log(d.items);
						for (let i = 0; i < d.items.length; i++){
							let main_item = cur_frm.add_child("main_items");
							main_item.item_code = d.items[i].item_code;
							main_item.item_name = d.items[i].item_name;
							main_item.qty = d.items[i].qty;
							main_item.uom = d.items[i].uom;
							main_item.rate = d.items[i].rate;
							main_item.amount = d.items[i].amount;
							main_item.reference_doc = sales_orders[s].sales_order
							cur_frm.refresh_field("main_items");

							frappe.db.get_value('BOM', {item: d.items[i].item_code, is_default: '1'}, ['name','total_cost'])
    						.then(r => {
        							let values = r.message;
        							//console.log(values);
									let t_bom = cur_frm.add_child("bom_list");
									t_bom.bom = values.name;
									t_bom.cost_per_unit = values.total_cost
									t_bom.reference_doc = sales_orders[s].sales_order
									t_bom.main_item = d.items[i].item_code;
									cur_frm.refresh_field("bom_list");

									frappe.db.get_doc('BOM', values.name)
    									.then(b => {
        									//console.log(b.items);
											for (let j = 0; j < b.items.length; j++){
												let recipe_item = cur_frm.add_child("recipe_items");
												recipe_item.item_code = b.items[j].item_code;
												recipe_item.item_name = b.items[j].item_name;
												recipe_item.qty = b.items[j].qty;
												recipe_item.uom = b.items[j].uom;
												frappe.db.get_value("Bin", {"item_code":b.items[j].item_code, "warehouse":cur_frm.doc.source_warehouse}, "actual_qty").then((r)=>{
													if(r.message.actual_qty){
														recipe_item.available_qty = r.message.actual_qty;
													}
												cur_frm.refresh_field("recipe_items");
												})
												frappe.db.get_value("Bin", {"item_code":b.items[j].item_code}, "valuation_rate").then((r)=>{
													if(r.message.valuation_rate){
														let price = 0;
														price = r.message.valuation_rate
														recipe_item.rate = price;
														recipe_item.amount = b.items[j].qty * price;
													}
												cur_frm.refresh_field("recipe_items");
												})
												recipe_item.parent_item = d.items[i].item_code;
												recipe_item.bom = values.name;
												recipe_item.reference_doc = sales_orders[s].sales_order
											}
									cur_frm.refresh_field("recipe_items");
    								})
    						})
						}		
    			})
			}
		}
		else{
			let material_requests = cur_frm.doc.material_requests;
			for(let s=0; s<material_requests.length; s++){
			frappe.db.get_doc('Material Request', material_requests[s].material_request)
    			.then(d => {
        				//console.log(d.items);
						for (let i = 0; i < d.items.length; i++){
							let main_item = cur_frm.add_child("main_items");
							main_item.item_code = d.items[i].item_code;
							main_item.item_name = d.items[i].item_name;
							main_item.qty = d.items[i].qty;
							main_item.uom = d.items[i].uom;
							main_item.rate = d.items[i].rate;
							main_item.amount = d.items[i].amount;
							main_item.reference_doc = material_requests[s].material_request
							cur_frm.refresh_field("main_items");

							frappe.db.get_value('BOM', {item: d.items[i].item_code, is_default: '1'}, ['name','total_cost'])
    						.then(r => {
        							let values = r.message;
        							//console.log(values);
									let t_bom = cur_frm.add_child("bom_list");
									t_bom.bom = values.name;
									t_bom.cost_per_unit = values.total_cost
									t_bom.reference_doc = material_requests[s].material_request
									t_bom.main_item = d.items[i].item_code;
									cur_frm.refresh_field("bom_list");

									frappe.db.get_doc('BOM', values.name)
    									.then(b => {
        									//console.log(b.items);
											for (let j = 0; j < b.items.length; j++){
												let recipe_item = cur_frm.add_child("recipe_items");
												recipe_item.item_code = b.items[j].item_code;
												recipe_item.item_name = b.items[j].item_name;
												recipe_item.qty = b.items[j].qty;
												recipe_item.uom = b.items[j].uom;
												frappe.db.get_value("Bin", {"item_code":b.items[j].item_code, "warehouse":cur_frm.doc.source_warehouse}, "actual_qty").then((r)=>{
													if(r.message.actual_qty){
														recipe_item.available_qty = r.message.actual_qty;
													}
												cur_frm.refresh_field("recipe_items");
												})
												frappe.db.get_value("Bin", {"item_code":b.items[j].item_code}, "valuation_rate").then((r)=>{
													if(r.message.valuation_rate){
														let price = 0;
														price = r.message.valuation_rate
														recipe_item.rate = price;
														recipe_item.amount = b.items[j].qty * price;
													}
												cur_frm.refresh_field("recipe_items");
												})
												recipe_item.parent_item = d.items[i].item_code;
												recipe_item.bom = values.name;
												recipe_item.reference_doc = material_requests[s].material_request
											}
									cur_frm.refresh_field("recipe_items");
    								})
    						})
						}		
    			})
			}
		}
	}

});
frappe.ui.form.on('MP Main Items', {
	item_code:function(frm, cdt, cdn){
		let row = locals[cdt][cdn];
		if(row.item_code){
			frappe.db.get_value("Item Price", {"item_code":row.item_code, "selling":1}, "price_list_rate").then((r)=>{
				if(r.message.price_list_rate){
					let price = 0;
					price = r.message.price_list_rate;
					//console.log(price);
					row.rate = price;
					row.amount = row.qty * price
					frm.refresh_field("main_items");
				}
			})

			frappe.db.get_value('BOM', {item: row.item_code, is_default: '1'}, 'name')
    		.then(r => {
        		let values = r.message;
        		//console.log(values.name);
				let t_bom = cur_frm.add_child("bom_list");
				t_bom.bom = values.name;
				t_bom.main_item = row.item_code;
				cur_frm.refresh_field("bom_list");

				frappe.db.get_doc('BOM', values.name)
    			.then(d => {
        				//console.log(d.items.length);
						for (let i = 0; i < d.items.length; i++){
							let recipe_item = cur_frm.add_child("recipe_items");
							recipe_item.item_code = d.items[i].item_code;
							recipe_item.item_name = d.items[i].item_name;
							recipe_item.qty = d.items[i].qty;
							recipe_item.uom = d.items[i].uom;
							frappe.db.get_value("Bin", {"item_code":d.items[i].item_code}, "valuation_rate").then((r)=>{
								if(r.message.valuation_rate){
										let price = 0;
										price = r.message.valuation_rate
										recipe_item.rate = price;
										recipe_item.amount = d.items[i].qty * price;
								}
								cur_frm.refresh_field("recipe_items");
							})
							recipe_item.parent_item = row.item_code;
							recipe_item.bom = values.name;
						}
						cur_frm.refresh_field("recipe_items");
    			})
    		})

		}

	},
	qty:function(frm, cdt, cdn){
		let row = locals[cdt][cdn];
		row.amount = row.qty * row.rate;
		frm.refresh_field("main_items");
	}
})