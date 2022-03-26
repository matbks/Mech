sap.ui.define([
	"./BaseController",
	"sap/ui/model/json/JSONModel",
	"../model/formatter",
	"sap/m/library",
	"sap/m/MessageBox",
	"sap/ui/model/Filter",
	"sap/ui/model/FilterOperator",
], function (BaseController, JSONModel, formatter, mobileLibrary, MessageBox, Filter, FilterOperator) {
	"use strict";

	// shortcut for sap.m.URLHelper
	var URLHelper = mobileLibrary.URLHelper;

	return BaseController.extend("sap.ui.demo.masterdetail.controller.Detail", {

		formatter: formatter,

		/* =========================================================== */
		/* lifecycle methods                                           */
		/* =========================================================== */

		onInit: function () {
			// Model used to manipulate control states. The chosen values make sure,
			// detail page is busy indication immediately so there is no break in
			// between the busy indication for loading the view's meta data
			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter
				.getRoute("order")
				.attachPatternMatched(this._onObjectMatched, this);

			var oViewModel = new JSONModel({
				busy: false,
				delay: 0,
				lineItemListTitle: this.getResourceBundle().getText("detailLineItemTableHeading")
			});

			this.getRouter().getRoute("object").attachPatternMatched(this._onObjectMatched, this);

			this.setModel(oViewModel, "detailView");

			this.getOwnerComponent().getModel().metadataLoaded().then(this._onMetadataLoaded.bind(this));

			this._data = {
				order_items: [],
			};

			this.jModel = new JSONModel(this._data);






		},

		/* =========================================================== */
		/* event handlers                                              */
		/* =========================================================== */

		/**
		 * Event handler when the share by E-Mail button has been clicked
		 * @public
		 */

		/**
		 * Updates the item count within the line item table's header
		 * @param {object} oEvent an event containing the total number of items in the list
		 * @private
		 */
		onListUpdateFinished: function (oEvent) {
			var sTitle,
				iTotalItems = oEvent.getParameter("total"),
				oViewModel = this.getModel("detailView");

			// only update the counter if the length is final
			if (this.byId("lineItemsList").getBinding("items").isLengthFinal()) {
				if (iTotalItems) {
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeadingCount", [iTotalItems]);
				} else {
					//Display 'Line Items' instead of 'Line items (0)'
					sTitle = this.getResourceBundle().getText("detailLineItemTableHeading");
				}
				oViewModel.setProperty("/lineItemListTitle", sTitle);
			}
		},

		/* =========================================================== */
		/* begin: internal methods                                     */
		/* =========================================================== */

		/**
		 * Binds the view to the object path and expands the aggregated line items.
		 * @function
		 * @param {sap.ui.base.Event} oEvent pattern match event in route 'object'
		 * @private
		 */
		_onObjectMatched: function (oEvent) {
			var sObjectId = oEvent.getParameter("arguments").objectId;
			this.sOrderId = sObjectId;
			this.getModel("device").setProperty("/layout", "TwoColumnsBeginExpanded");

			this.getModel()
				.metadataLoaded()
				.then(
					function () {
						var sObjectPath = this.getModel().createKey("OrdersSet", {
							Id: sObjectId,
						});
						this._bindView("/" + sObjectPath);
					}.bind(this)
				);

			this.getItems(this.sOrderId);

		},

		/**
		 * Binds the view to the object path. Makes sure that detail view displays
		 * a busy indicator while data for the corresponding element binding is loaded.
		 * @function
		 * @param {string} sObjectPath path to the object to be bound to the view.
		 * @private
		 */
		_bindView: function (sObjectPath) {
			// Set busy indicator during view binding
			var oViewModel = this.getModel("detailView");

			// If the view was not bound yet its not busy, only if the binding requests data it is set to busy again
			oViewModel.setProperty("/busy", false);

			this.getView().bindElement({
				path: sObjectPath,
				events: {
					change: this._onBindingChange.bind(this),
					dataRequested: function () {
						oViewModel.setProperty("/busy", true);
					},
					dataReceived: function () {
						oViewModel.setProperty("/busy", false);
					}
				}
			});
		},

		_onBindingChange: function () {
			var oView = this.getView(),
				oElementBinding = oView.getElementBinding();

			// No data for the binding
			if (!oElementBinding.getBoundContext()) {
				this.getRouter().getTargets().display("detailObjectNotFound");
				// if object could not be found, the selection in the master list
				// does not make sense anymore.
				this.getOwnerComponent().oListSelector.clearMasterListSelection();
				return;
			}

			var sPath = oElementBinding.getPath(),
				oResourceBundle = this.getResourceBundle(),
				oObject = oView.getModel().getObject(sPath),
				sObjectId = oObject.ObjectID,
				sObjectName = oObject.Name,
				oViewModel = this.getModel("detailView");

			this.getOwnerComponent().oListSelector.selectAListItem(sPath);

			oViewModel.setProperty("/shareSendEmailSubject",
				oResourceBundle.getText("shareSendEmailObjectSubject", [sObjectId]));
			oViewModel.setProperty("/shareSendEmailMessage",
				oResourceBundle.getText("shareSendEmailObjectMessage", [sObjectName, sObjectId, location.href]));
		},

		_onMetadataLoaded: function () {
			// Store original busy indicator delay for the detail view
			var iOriginalViewBusyDelay = this.getView().getBusyIndicatorDelay(),
				oViewModel = this.getModel("detailView"),
				oLineItemTable = this.byId("pes")
			iOriginalLineItemTableBusyDelay = oLineItemTable.getBusyIndicatorDelay();

			// Make sure busy indicator is displayed immediately when
			// detail view is displayed for the first time
			oViewModel.setProperty("/delay", 0);
			oViewModel.setProperty("/lineItemTableDelay", 0);

			oLineItemTable.attachEventOnce("updateFinished", function () {
				// Restore original busy indicator delay for line item table
				oViewModel.setProperty("/lineItemTableDelay", iOriginalLineItemTableBusyDelay);
			});

			// Binding the view will set it to not busy - so the view is always busy if it is not bound
			oViewModel.setProperty("/busy", true);
			// Restore original busy indicator delay for the detail view
			oViewModel.setProperty("/delay", iOriginalViewBusyDelay);
		},

		/**
		 * Set the full screen mode to false and navigate to master page
		 */
		onCloseDetailPress: function () {
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", false);
			// No item should be selected on master after detail page is closed
			this.getOwnerComponent().oListSelector.clearMasterListSelection();
			this.getRouter().navTo("master");
		},

		/**
		 * Toggle between full and non full screen mode.
		 */
		toggleFullScreen: function () {
			var bFullScreen = this.getModel("appView").getProperty("/actionButtonsInfo/midColumn/fullScreen");
			this.getModel("appView").setProperty("/actionButtonsInfo/midColumn/fullScreen", !bFullScreen);
			if (!bFullScreen) {
				// store current layout and go full screen
				this.getModel("appView").setProperty("/previousLayout", this.getModel("appView").getProperty("/layout"));
				this.getModel("appView").setProperty("/layout", "MidColumnFullScreen");
			} else {
				// reset to previous layout
				this.getModel("appView").setProperty("/layout", this.getModel("appView").getProperty("/previousLayout"));
			}
		},

		onPress: function (oEvent) {
			var oItem = oEvent.getSource();
			var sPath = oItem.getBindingContext().getPath("Plate");
			var sPath1 = oItem.getBindingContext().getPath("Customerid");
			var oTable = this.getView().byId("tableVehicles");
			var modelData = oTable.getModel();
			var data = modelData.getProperty(sPath);
			var data1 = modelData.getProperty(sPath1);

			var oRouter = sap.ui.core.UIComponent.getRouterFor(this);
			oRouter.navTo("order", {
				invoicePath: data,
				invoicePath1: data1
			});
		},

		addRow: function (oArg) {
			this._data.order_items.push({ Description: "", Quantity: "", Price: "", Type: "", Unit: "" });
			this.jModel.refresh(); //which will add the new record
		},

		deleteRow: function (oEvent) {
			var deleteRecord = oEvent
				.getSource()
				.getBindingContext("servicesAndProducts");
			//	.getObject();
			//	.getPath();
			for (var i = 0; i < this._data.order_items.length; i++) {
				if (this._data.order_items[i] == deleteRecord.getObject()) {

					var line = this._data.order_items[i];

					if (line.Description != '' && line.Id != '' && line.Item != '' && line.Quantity != '' && line.Type != '' && line.Price != '' && line.Unit != '') {
						var oModel = this.getView().getModel();

						oModel.remove("/OrderItemsSet(Id='" + deleteRecord.getObject().Id + "'," + "Item='" + deleteRecord.getObject().Item + "')", {
							success: function (oData, oResponse) {
								if (oResponse.statusCode == "204") {
									var msg = this.getOwnerComponent().getModel("i18n").getResourceBundle().getText("deleted");
									MessageBox.success(msg);

								}
							}.bind(this),
							error: function (oError) {
								var oSapMessage = JSON.parse(oError.responseText);
								var msg = oSapMessage.error.message.value;
								MessageBox.error(msg);
							},
						});
					}
					this._data.order_items.splice(i, 1); //removing 1 record from i th index.
					this.jModel.refresh();
				}
			}
		},

		getItems: function (id) {

			var oFilter = [
				new Filter("Id", FilterOperator.EQ, id),
			];
			var oModel = this.getView().getModel();
			oModel.read("/OrderItemsSet", {
				filters: oFilter,
				success: function (oData, oResponse) {
					this._data.order_items = oData.results;
					this.jModel.refresh();
					this.byId("pes").getModel().refresh(true);
				}.bind(this),
				error: function (oError) {
					this.jModel.setData(this._data);
				}.bind(this),
			});
		},

		// getItems: function(id) {

		// 	if ( this.select("/OrderItemsSet", this._data.order_items, "Id", id) == "0" ) 
		// 	{
		// 		this.jModel.refresh();
		// 		this.byId("pes").getModel().refresh(true);
		// 	}
		// 	else{ this.jModel.setData(this._data); }

		// },

		onBeforeRendering: function () {

			this.byId("pes").setModel(this.jModel, "servicesAndProducts");
		},
		onNavBack: function () {
			history.go(-2);
		},

		onClearMessages: function () {
			this.getModel("orderView").setProperty(
				"/messageIcon",
				"sap-icon://message-success"
			);

			sap.ui.getCore().getMessageManager().removeAllMessages();

		},

		saveRow: function (oEvent) {

			var createItemError = false
			var createItemErrorLog;
			var keys_to_be_deleted = [];

			for (let key in this._data.order_items) {

				if (this._data.order_items[key].Id == undefined && this._data.order_items[key].Item == undefined) {
					var line = this._data.order_items[key];


					if (line.Description != '' && line.Id != '' && line.Item != '' && line.Quantity != '' && line.Type != '' && line.Price != '' && line.Unit != '') {
						var item = key;
						item = ++item;

						line.Id = this.sOrderId;
						line.Item = item.toString();
						line.Description = line.Description;
						line.Quantity = line.Quantity.toString();
						line.Type = line.Type;
						line.Price = line.Price.toString();
						line.Unit = line.Unit.toString();

						var oModel = this.getView().getModel();

						oModel.create("/OrderItemsSet", line, {
							success: function (oData, oResponse) {
								if (
									key == this._data.order_items.length - 1 &&
									createItemError == false
								) {
									this._clearOrderTable();
								}
							}.bind(this),
							error: function (oError) {
								createItemError = true;
								createItemErrorLog = "Falha na criação do item da linha " + key;
							}.bind(this),
						});
					}
					else if (line.Description != '' || line.Quantity != '' || line.Type != '' || line.Price != '' || line.Unit != '')
					{	
						var errorLine = parseInt(key) + 1;
						createItemError = true;
						createItemErrorLog = "Preencha todos os dados da linha " + errorLine;
					}
					else {
						keys_to_be_deleted.push(key);
					}
				}
				else {
					var updateItemError = false;
					var updateItemErrorLog;
					var line = this._data.order_items[key];

					var item = key;
					item = ++item;

					line.Id = this.sOrderId;
					line.Item = item.toString();
					line.Description = line.Description;
					line.Quantity = line.Quantity.toString();
					line.Type = line.Type;
					line.Price = line.Price.toString();
					line.Unit = line.Unit.toString();

					var oModel = this.getView().getModel();

					oModel.update("/OrderItemsSet(Id='" + line.Id + "'," + "Item='" + line.Item + "')", line, 
					{
						method: "PUT",
						success: function(oData, oResponse) { sap.m.MessageToast.show(" updated Successfully");}, 
						error: function(oError) {sap.m.MessageToast.show("failure");} 
					});
				}
			}

			for (let x in keys_to_be_deleted.sort((a, b) => b - a)) 
			{
				this._data.order_items.splice(keys_to_be_deleted[x], 1); //removing 1 record from i th index.
			}

			this.jModel.refresh();

			if (updateItemError && createItemError == false) 
			{
				MessageBox.success(updateItemErrorLog);
			}
			else if (updateItemError == false && createItemError)
			{
				MessageBox.success(createItemErrorLog);
			}
			else 
			{ 
				MessageBox.success("Salvo com sucesso");
			}
		}



	});

});