Ext.ns('EzScrum.Plugin.TaskBoard');

//Partner Menu
EzScrum.Plugin.TaskBoard.PartnerMenu = new Ext.menu.Menu({
	listeners:{
		// update TagTriggerField when CheckItem was clicked
		itemclick:function(item){
			var checked = !item.checked; // click 當下取得是舊的狀態
			var tagRaw = item.triggerField.getValue();
			var tags = [];
			if (tagRaw.length != 0) {
				tags = tagRaw.split(";");
			}
			
			if(checked) {
				if(tagRaw.search(item.text)<0) {
					// 若field中已經存在該text, 不將該對應item 勾選
					tags.push(item.text);
				}
			}else {
				var index = tags.indexOf(item.text);
				tags.splice(index, 1);
			}

			item.triggerField.setValue(tags.join(";"));
		}
	}
});

//Partner Trigger Field
EzScrum.Plugin.TaskBoard.PartnerTriggerField = Ext.extend( Ext.form.TriggerField, {
	tt		   : 'field',
	fieldLabel : 'Partners',
	name       : 'Partners',
	editable   : false,
	store: EzScrum.Plugin.TaskBoard.PartnerStore,
	menu: EzScrum.Plugin.TaskBoard.PartnerMenu,	
	loadData : function(response){
		this.store.loadData(response.responseXML);
		
		this.menu.removeAll();
		for(var i=0; i<this.store.getCount(); i++) {
			var record = this.store.getAt(i);
			var info = record.get('Name');
			this.menu.add({
				tagId 	: info,
				text	: info,
				xtype	: 'menucheckitem',
				hideOnClick	: false,
				/*
				 * 如果要作成xtype, 須將partnerTriggerField設定至item的屬性
				 * 在click觸發後才有辦法利用triggerField來 setValue
				 * 若將partnerTriggerField透過method存至partnerMenu的屬性 或 直接抓PartnerTriggerField 會call不到setValue
				 */ 
				triggerField : this 
			});
		}
	},
	onTriggerClick : function(){
		// A array of items of the menu
		var checkedItem = EzScrum.Plugin.TaskBoard.PartnerMenu.findByType('menucheckitem');
		
		// the name list of the project team
		var partnerMenuList = this.getValue().split(';');
		// 將 field 欄位中的有的 partner, 在其對應的 menu item 打勾
		for(var i=0; i<checkedItem.length; i++) {
			// default value
			EzScrum.Plugin.TaskBoard.PartnerMenu.items.get(i).setChecked(false);
			// setCheck partners
			for(var j=0; j<partnerMenuList.length; j++) {
				if(partnerMenuList[j] == checkedItem[i].text) {
					EzScrum.Plugin.TaskBoard.PartnerMenu.items.get(i).setChecked(true);
				}
			}
		}
		EzScrum.Plugin.TaskBoard.PartnerMenu.showAt(this.getPosition());
	}
});
// 將 EzScrum.Plugin.TaskBoard.PartnerTriggerField 以名稱 'PartnerWidget_TaskBoard' xtype 的形式 註冊到Ext ComponentMgr  
Ext.reg('PartnerWidget_TaskBoard', EzScrum.Plugin.TaskBoard.PartnerTriggerField);
