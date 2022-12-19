// Copyright (c) 2022, SMB and contributors
// For license information, please see license.txt

frappe.ui.form.on('Meal Process', {
	setup(frm) {
		frm.fields_dict['main_items'].grid.get_field("item_code").get_query = function(doc, cdt, cdn) {
	    return {
		    filters: [
			    ['Item', 'has_recipe', '=','1'],
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
		if(cur_frm.doc.source_warehouse){
			if(cur_frm.doc.get_items_from == "Sales Order"){
				frm.clear_table("main_items");
				frm.clear_table("bom_list");
				frm.clear_table("recipe_items");
				let sales_orders = cur_frm.doc.sales_orders;
				var sales_orders_numbers = [];
				for(var i in sales_orders){
					sales_orders_numbers.push(sales_orders[i].sales_order);
				}
				//console.log(sales_orders_numbers);
				frappe.call({
						method: "kitchen_module.kitchen_module.doctype.meal_process.meal_process.sales_order_get_items",
						args: {
								"sales_orders": sales_orders_numbers,
								"source_warehouse": frm.doc.source_warehouse
						},
						freeze: true,
    					freeze_message: "Processing",
						callback: function(r) {
								if(r.message) {
									//console.log(r.message);
									let main_items = r.message[0];
									let boms = r.message[1];
									let recipe_items = r.message[2];
									console.log(main_items,boms,recipe_items);
									for (let i = 0; i < main_items.length; i++){
										let main_item = cur_frm.add_child("main_items");
											main_item.item_code = main_items[i].item_code;
											main_item.item_name = main_items[i].item_name;
											main_item.qty = main_items[i].qty;
											main_item.uom = main_items[i].uom;
											main_item.rate = main_items[i].rate;
											main_item.amount = main_items[i].amount;
											main_item.sales_order_ref = main_items[i].parent;
											cur_frm.refresh_field("main_items");
									}

									for(let j=0;j<boms.length; j++){
										let t_bom = cur_frm.add_child("bom_list");
										t_bom.bom = boms[j].bom_name;
										t_bom.main_item = boms[j].main_item;
										t_bom.cost_per_unit = boms[j].total_cost;
										t_bom.sales_order_ref = boms[j].sales_order;
										cur_frm.refresh_field("bom_list");
									}

									for (let k = 0; k < recipe_items.length; k++){
										let recipe_item = cur_frm.add_child("recipe_items");
											recipe_item.item_code = recipe_items[k].item_code;
											recipe_item.item_name = recipe_items[k].item_name;
											recipe_item.bom_qty = recipe_items[k].qty;
											recipe_item.uom = recipe_items[k].uom;
											recipe_item.available_qty = recipe_items[k].available_qty;
											recipe_item.rate = recipe_items[k].rate;
											recipe_item.amount = recipe_items[k].amount;
											recipe_item.parent_item = recipe_items[k].parent_item;
											recipe_item.bom = recipe_items[k].bom;
											recipe_item.sales_order_ref = recipe_items[k].sales_order;
											cur_frm.refresh_field("recipe_items");
									} 	
								}
						}
				});
			}
			else{
				frm.clear_table("main_items");
				frm.clear_table("bom_list");
				frm.clear_table("recipe_items");
				let material_requests = cur_frm.doc.material_requests;
				var material_requests_numbers = [];
				for(var i in material_requests){
					material_requests_numbers.push(material_requests[i].material_request);
				}
				//console.log(material_requests_numbers);
				frappe.call({
						method: "kitchen_module.kitchen_module.doctype.meal_process.meal_process.material_request_get_items",
						args: {
								"material_requests": material_requests_numbers,
								"source_warehouse": frm.doc.source_warehouse
						},
						freeze: true,
    					freeze_message: "Processing",
						callback: function(r) {
								if(r.message) {
									//console.log(r.message);
									let main_items = r.message[0];
									let boms = r.message[1];
									let recipe_items = r.message[2];
									console.log(main_items,boms,recipe_items);
									for (let i = 0; i < main_items.length; i++){
										let main_item = cur_frm.add_child("main_items");
											main_item.item_code = main_items[i].item_code;
											main_item.item_name = main_items[i].item_name;
											main_item.qty = main_items[i].qty;
											main_item.uom = main_items[i].uom;
											main_item.rate = main_items[i].rate;
											main_item.amount = main_items[i].amount;
											main_item.material_request_ref = main_items[i].parent;
											cur_frm.refresh_field("main_items");
									}

									for(let j=0;j<boms.length; j++){
										let t_bom = cur_frm.add_child("bom_list");
										t_bom.bom = boms[j].bom_name;
										t_bom.main_item = boms[j].main_item;
										t_bom.cost_per_unit = boms[j].total_cost;
										t_bom.material_request_ref = boms[j].material_request;
										cur_frm.refresh_field("bom_list");
									}

									for (let k = 0; k < recipe_items.length; k++){
										let recipe_item = cur_frm.add_child("recipe_items");
											recipe_item.item_code = recipe_items[k].item_code;
											recipe_item.item_name = recipe_items[k].item_name;
											recipe_item.bom_qty = recipe_items[k].qty;
											recipe_item.uom = recipe_items[k].uom;
											recipe_item.available_qty = recipe_items[k].available_qty;
											recipe_item.rate = recipe_items[k].rate;
											recipe_item.amount = recipe_items[k].amount;
											recipe_item.parent_item = recipe_items[k].parent_item;
											recipe_item.bom = recipe_items[k].bom;
											recipe_item.material_request_ref = recipe_items[k].material_request;
											cur_frm.refresh_field("recipe_items");
									} 	
								}
						}
				});
			}
		}
		else{
			frappe.msgprint(__('Enter Source and Target Warehouse '));
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

			frappe.db.get_value('BOM', {item: row.item_code, is_default: '1'}, ['name','total_cost'])
    		.then(r => {
        		let values = r.message;
        		//console.log(values.name);
				let t_bom = cur_frm.add_child("bom_list");
				t_bom.bom = values.name;
				t_bom.main_item = row.item_code;
				t_bom.cost_per_unit = values.total_cost;
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
							frappe.db.get_value("Bin", {"item_code":d.items[i].item_code, "warehouse":cur_frm.doc.source_warehouse}, ["actual_qty","valuation_rate"]).then((r)=>{
								if(r.message.actual_qty){
									recipe_item.available_qty = r.message.actual_qty;
								}
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
	},
	before_main_items_remove:function(frm, cdt, cdn){
		var deleted_row = frappe.get_doc(cdt, cdn);
    	//console.log(deleted_row.item_code);
		if(cur_frm.doc.bom_list && cur_frm.doc.recipe_items){
			let boms = cur_frm.doc.bom_list;
			for(var i=0;i<boms.length;i++){
				if (boms[i].main_item == deleted_row.item_code){
					cur_frm.get_field("bom_list").grid.grid_rows[i].remove();
				}
			}
			let recipes = cur_frm.doc.recipe_items;
			for(var j=recipes.length-1;j>=0;j--){
				if(recipes[j].parent_item == deleted_row.item_code){
					cur_frm.get_field("recipe_items").grid.grid_rows[j].remove();
				}
			}

		}
		
		cur_frm.refresh();
	}
});
frappe.ui.form.on('Production Plan Sales Order', {
	before_sales_orders_remove:function(frm, cdt, cdn){
		var deleted_row = frappe.get_doc(cdt, cdn);
    	//console.log(deleted_row.item_code);
		if(cur_frm.doc.main_items && cur_frm.doc.bom_list && cur_frm.doc.recipe_items){
			let m_items = cur_frm.doc.main_items;
			for(var j=m_items.length-1;j>=0;j--){
				if(m_items[j].sales_order_ref == deleted_row.sales_order){
					cur_frm.get_field("main_items").grid.grid_rows[j].remove();
				}
			}
			let boms = cur_frm.doc.bom_list;
			for(var i=0;i<boms.length;i++){
				if (boms[i].sales_order_ref == deleted_row.sales_order){
					cur_frm.get_field("bom_list").grid.grid_rows[i].remove();
				}
			}
			let recipes = cur_frm.doc.recipe_items;
			for(var j=recipes.length-1;j>=0;j--){
				if(recipes[j].sales_order_ref == deleted_row.sales_order){
					cur_frm.get_field("recipe_items").grid.grid_rows[j].remove();
				}
			}

		}
		
		cur_frm.refresh();
	}
});
frappe.ui.form.on('Production Plan Material Request', {
	before_material_requests_remove:function(frm, cdt, cdn){
		var deleted_row = frappe.get_doc(cdt, cdn);
    	//console.log(deleted_row.item_code);
		if(cur_frm.doc.main_items && cur_frm.doc.bom_list && cur_frm.doc.recipe_items){
			let m_items = cur_frm.doc.main_items;
			for(var j=m_items.length-1;j>=0;j--){
				if(m_items[j].material_request_ref == deleted_row.material_request){
					cur_frm.get_field("main_items").grid.grid_rows[j].remove();
				}
			}
			let boms = cur_frm.doc.bom_list;
			for(var i=0;i<boms.length;i++){
				if (boms[i].material_request_ref == deleted_row.material_request){
					cur_frm.get_field("bom_list").grid.grid_rows[i].remove();
				}
			}
			let recipes = cur_frm.doc.recipe_items;
			for(var j=recipes.length-1;j>=0;j--){
				if(recipes[j].material_request_ref == deleted_row.material_request){
					cur_frm.get_field("recipe_items").grid.grid_rows[j].remove();
				}
			}

		}
		
		cur_frm.refresh();
	}
});