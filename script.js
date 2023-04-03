"use strict";
(function(){
	let offset = [0,0]; 

	const connectorCollection  = new Map(); 

	const WidgetCollection = new Map();

	document.addEventListener("DOMContentLoaded", function(){

		// Ignore Right Mouse Button (for now)
		document.getElementById("toolBar").addEventListener("contextmenu", function(e) { 
			event.preventDefault();
		});

		document.getElementById("toolBar").addEventListener("click", function(e) { 
			event.preventDefault();
			if(e.target.classList.contains("ToolBarButton")){
				tbbClick();
			}
			if(e.target.classList.contains("SaveButton")){
				Serialise();
			}
		});

		// Ignore Right Mouse Button (for now)
		document.getElementById("workspace").addEventListener("contextmenu", function(e) { 
			event.preventDefault();
		});

		document.getElementById("workspace").addEventListener("mousedown", function(e) { 
			if(e.target.classList){
				if(e.target.classList.contains("connectorNode")){
					nodeMouseDown();
				}
				else if(e.target.classList.contains("inputConnectorPoint")){
					nodeMouseDown();
				}
				else if(e.target.classList.contains("widgetTitle")){
					titleTextMouseDown();
				}
				else if(e.target.classList.contains("nodeBlock")){
					mouseDown();
				}
			}
		});

		document.getElementById("workspace").addEventListener("click", function(e) { 
			
			if(e.target.classList){
				if(e.target.classList.contains("closeButton")){
					closeButtonClick();
				}
				else if(e.target.classList.contains("inputConnectorPoint")){
					nodeConnectorClick('in');
				}
				else if(e.target.classList.contains("outputConnectorPoint")){
					nodeConnectorClick('out');
				}
			}
			else{
				if(e.target.className.baseVal === "unselectedPath"){
					connectorClick();
				}
				else if(e.target.className.baseVal === "selectedPath"){
					connectorClick();
				}
			}
		});

	});	

	const Serialise = function(){
		const js = [];
		js.push("Widgets:{\n");
		WidgetCollection.forEach(function(v){
			js.push(v.id, ':{\n');
			js.push('title:', v.title, ",\n");
			js.push('inputs:', JSON.stringify(v.inputs), ",\n");
			js.push('outputs:', JSON.stringify(v.outputs), ",\n");
			js.push('location:', JSON.stringify(v.location), ",\n");
			js.push('size:', JSON.stringify(v.size), ",\n");
			js.push('connectors:[');
			const cons = [];
			v.connectors.forEach(function(v, k, m){
				cons.push(k);
			});
			js.push(cons.join(",\n"));
			js.push("]\n},")
		});
		js.push("}")
		js.push("Connectors:{\n");
		connectorCollection.forEach(function(v, k, m){
			js.push(v.id, ':{\n');
			js.push('index:"', v.index, "\",\n");
			js.push('inputNode:"', v.inputNode, "\",\n");
			js.push('outputNode:"', v.outputNode, "\",\n");
			js.push('inWidgetId:"', v.inWidgetId, "\",\n");
			js.push('outWidgetId:"', v.outWidgetId, "\",\n");
			js.push("},\n");
		});
		js.push("}")
		console.log(js.join(""));	}
	
	const Widget = function(){ 
		this.id = "";
		this.title = "";
		this.inputs = []; // Array of strings 
		this.outputs = []; // Array of strings 
		this.location = new Point(0, 0);
		this.size = new Point(0, 0);
		this.connectors = {}; 
		
		if(typeof(Widget.prototype.init) !== 'function'){
			Widget.prototype.init = function(widgetParams){ 
				Widget.prototype.inputNodeCount |= 0; // unique numbers for each input node
				Widget.prototype.outputNodeCount |= 0; // ''
				Widget.prototype.numWidgets |= 0;
				this.connectors = new Map(); 
				this.inputs = widgetParams.inputs; 
				this.outputs = widgetParams.outputs; 
				this.title = widgetParams.title; 
				this.id = this.title + Widget.prototype.numWidgets; 
				this.size.y = Math.max(this.inputs.length, this.outputs.length); 
				this.size.y *= 24; 
				this.size.y += 5;
				this.location.y = 20;  //Initial position in workspace
				this.location.x = 40; 
				Widget.prototype.numWidgets += 1; 
				return this; 
			}
			

			Widget.prototype.getHtml = function(){ 
				const html = []; 
				html.push("<div class='Widget' id='", this.id, "' style='height:", this.size.y, "px;'> "); 
				html.push("<div class='nodeBlock' style='height:", this.size.y, "px'>"); 
				for(let i = 0; i < this.inputs.length; i++){ 
					let top = (i * 24) + 5;
					if(this.inputs[i].constructor === Array){  // Create Pull-Down
						html.push("<select class='connectorNode inputSelectNode selectNode' "); 
						html.push("id='inputNode", Widget.prototype.inputNodeCount++, "' "); 
						html.push("style='top:", top, "px;'>"); 
						const len = this.inputs[i].length - 1;
						for(let j = 0; j < len; j++){ 
							html.push("<option");
							if(this.inputs[i][len] === j){
								html.push(" selected"); // Set the default
							}
							html.push(">", this.inputs[i][j], "</option>"); 
						} 
						html.push("</select>"); 
					} 
					else{ 
						html.push("<div class='connectorNode inputNode' "); 
						html.push("id='inputNode", Widget.prototype.inputNodeCount++, "'"); 
						html.push("style='top:", top, "px;'>", this.inputs[i], "</div>"); 
					} 
					html.push("<div class='inputConnectorPoint' style='top:", top, "px;'></div>");
				} 
				for(let i = 0; i < this.outputs.length; i++){ 
					let top = (i * 24) + 5;
					html.push("<div class='connectorNode outputNode' "); 
					html.push("id='outputNode", Widget.prototype.outputNodeCount++, "'"); 
					html.push("style='top:", top, "px;'>", this.outputs[i], "</div>"); 
					html.push("<div class='outputConnectorPoint' style='top:", top, "px;'></div>");
				} 
				html.push("</div><div class='widgetTitle'>"); 
				html.push("<input class='titleText' type='text' value='", this.title, "'/>"); 
				html.push("<img class='closeButton' src='closeButton.png'></img></div></div></div>"); 
				return html.join(""); 
			} 

			Widget.prototype.associateConnector = function(connector){ 
				this.connectors.set(connector.index, connector.id); 
			} 

			Widget.prototype.removeConnector = function(connector){ 
				this.connectors.delete(connector.index); 
			} 

			Widget.prototype.draw = function(){ 
				getElem("workspace").insertAdjacentHTML('beforeend', this.getHtml()); 
				return this;
			}

			Widget.prototype.destroy = function(){
				getElem("workspace").removeChild(getElem(this.id)); 	
				this.connectors.forEach(function(thisConnector){thisConnector.delete(thisConnector.index);});
				WidgetCollection.delete(this.id);
			}
		} //end of if(typeof(Widget.prototype.init) !== 'function')
	} // End of Widget definition

	const WidgetParams = {
		OscillatorWidget: { title: "Oscillator", 
							inputs: ["Pitch", "Detune", ["Sine", "Square", "Sawtooth", "Triangle", 1]], 
							outputs: ["Output"]}, 

		NoiseWidget: {		title: "Noise",
							inputs: [],
							outputs: ["Output"]},

		EnvelopeWidget: {	title: "Envelope", 
							inputs: ["Note On", "Velocity", "Attack", "Decay", "Sustain", "Release"], 
							outputs: ["Output"]}, 

		SampleWidget: {		title: "Sample", 
							inputs: [ "Pitch", "Note On", "File"], 
							outputs: ["Output"]},

		MixerWidget: {		title: "Mixer", 
							inputs: ["input 1", "input 2", "input 3", "input 4", "input 5", "input 6"], 
							outputs: ["Left", "Right"]},

		RenderWidget: {		title: "Render", 
							inputs: ["Left Input", "Right Input", "File Name"], 
							outputs: []}, 

		DelayWidget: {		title: "Delay", 
							inputs: ["Input", "Delay"], 
							outputs: ["Output"]}, 

		ValueWidget: {		title: "Value", 
							inputs: [], 
							outputs: ["Value"]}, 

		MidiInWidget: {		title: "Midi In", 
							inputs: [["Omni", "Ch1", "Ch2", "Ch3", "Ch4", "Ch5", "Ch6", "Ch7", "Ch8", "Ch9", 
										 "Ch10", "Ch11", "Ch12", "Ch13", "Ch14", "Ch15", "CH16", "QWERTY", 4]], 
							outputs: ["Pitch", "Note On", "Velocity", "Mod1", "Mod2"]}, 

		FilterWidget: {		title: "Filter",
							inputs: ["Input", ["Low Pass", "HighPass", 0], "Freq", "Depth", "Delta"],
							outputs: ["Output"]},

		AudioInWidget: {	title: "Audio In",
							inputs: [["Mic", "Line", "Web", "File", 0], "Volume"],
							outputs: ["Left", "Right"]},

		SpeakersWidget: {	title: "Speakers",
							inputs: ["Left", "Right", "Volume"],
							outputs: []},
		
		AmplifierWidget: {	title: "Amplifier",
							inputs: ["In", "Gain"],
							outputs: ["Out"]},
							
		LoadWidget: {		title: "Load",
							inputs: [],
							outputs: []},

		SaveWidget: {		title: "Save",
							inputs: [],
							outputs: []},
	};

	const drawToolBarButtons = function(){
		let htmlText = []; 
		for(var wp in WidgetParams){
			if(WidgetParams[wp].title === "Save"){
				htmlText.push("<div class='SaveButton' id='", wp, "'>", WidgetParams[wp].title, "</div>");
			}
			else if(WidgetParams[wp].title === "Load"){
				htmlText.push("<div class='LoadButton' id='", wp, "'>", WidgetParams[wp].title, "</div>");
			}
			else{
				htmlText.push("<div class='ToolBarButton' id='", wp, "'>", WidgetParams[wp].title, "</div>");
			}
		}
		getElem("toolBar").insertAdjacentHTML('beforeend', htmlText.join("")); 
	}

	// Tool Bar Buton Clicked
	const tbbClick = function(){ 
		event.stopPropagation(); 
		const thisWidget = new(Widget);
		thisWidget.init(WidgetParams[event.target.id]).draw();
		WidgetCollection.set(thisWidget.id, thisWidget); 
	} 

	let outputClicked = false; 
	let outWidgetId = "";
	let inputClicked = false; 
	let inWidgetId = "";

	// Adds connectors between nodes
	const nodeConnectorClick = function(in_out){ 
		event.stopPropagation(); 
		if(in_out === 'out'){
			outputClicked = event.srcElement.previousSibling.id; 
			outWidgetId = event.srcElement.parentElement.parentElement.id;
		}
		else{
			inputClicked = event.srcElement.previousSibling.id; 
			inWidgetId = event.srcElement.parentElement.parentElement.id;
		}
		if((inputClicked !== false) && (outputClicked !== false)){ 
			const newConnector = new(Connector);
			newConnector.init(outputClicked, inputClicked); 
			newConnector.outWidgetId = outWidgetId;
			newConnector.inWidgetId = inWidgetId;
			newConnector.draw(); 
			connectorCollection.set(newConnector.id, newConnector); 
			WidgetCollection.get(outWidgetId).associateConnector(newConnector);
			WidgetCollection.get(inWidgetId).associateConnector(newConnector);
			inputClicked = false; 
			outputClicked = false; 
		} 
	} 


	const nodeMouseDown = function(){ 
		event.stopPropagation(); 
	} 

	const titleTextMouseDown = function(){ 
		event.stopPropagation(); 
	} 

	const widgetClick = function(){ 
		event.stopPropagation(); 
	} 

	const Point = function(x, y){this.x = x; this.y = y;};

	const Connector = function(){ 
		this.id = ""; 
		this.index = 0;
		this.selected = false; 
		this.outputNode = ""; 
		this.inputNode = ""; 
		this.inWidgetId = "";
		this.outWidgetId = "";

		if(typeof(Connector.prototype.init) !== 'function')
		{
		
			Connector.prototype.init = function(outputNode, inputNode){ 
				Connector.prototype.numConnectors |= 0;
				this.outputNode = outputNode; 
				this.inputNode = inputNode; 
				this.index = Connector.prototype.numConnectors;
				Connector.prototype.numConnectors += 1; 
				this.id = "connector" + this.index; 
				return this; 
			} 
			
			Connector.prototype.computeDString = function(){
				const startNodeRect = getElem(this.outputNode).getBoundingClientRect(); 
				const endNodeRect = getElem(this.inputNode).getBoundingClientRect(); 
				const startPoint = new Point(startNodeRect.right - 143, startNodeRect.top + 9);
				const endPoint =   new Point(endNodeRect.left - 165, endNodeRect.top + 9);
				const curveLength = 50;

				return "M" + startPoint.x + "," + 
						 startPoint.y + " C" + 
						(startPoint.x + curveLength)  + "," + 
						 startPoint.y + " " + 
						(endPoint.x - curveLength) + "," + 
						 endPoint.y + " " + 
						 endPoint.x + "," + 
						 endPoint.y; 
			}
			
			Connector.prototype.draw = function(){ 
				const newpath = document.createElementNS("http://www.w3.org/2000/svg","path"); 
				newpath.setAttributeNS(null, 'class', 'unselectedPath'); 
				newpath.setAttributeNS(null, "id", this.id); 
				newpath.setAttributeNS(null, "d", this.computeDString()); 
				getElem('svgElement').appendChild(newpath); 
			} 
			
			Connector.prototype.move = function(){
				getElem(this.id).setAttributeNS(null, "d", this.computeDString());
			}

			Connector.prototype.delete = function(){ 
				getElem('svgElement').removeChild(getElem(this.id)); 
				WidgetCollection.get(this.inWidgetId).removeConnector(this);
				WidgetCollection.get(this.outWidgetId).removeConnector(this);
				connectorCollection.delete(this.id); 
			} 
		}
	} // End of Connector definition

	const connectorClick = function(){ 
		event.stopPropagation(); 
		if(event.target.className.baseVal !== 'selectedPath'){ 
			event.target.className.baseVal = 'selectedPath';
			connectorCollection.get(event.target.id).selected = true; 
		} 
		else{ 
			event.target.className.baseVal = 'unselectedPath';
			connectorCollection.get(event.target.id).selected = false; 
		} 
	} 

	const bodyKeyDown = function(e){ 
		if(e.key === 'Del'){ 
			connectorCollection.forEach(function(thisConnector){ 
				if(thisConnector.selected === true){ 
					thisConnector.delete(); 
				} 
			}); 
		} 
	} 



	const closeButtonClick = function(){ 
		event.stopPropagation(); 
		WidgetCollection.get(event.target.parentNode.parentNode.id).destroy();
	} 

	const getElem = function(idString){ 
		return document.getElementById(idString); 
	} 

	const mouseUp = function(){ 
		event.stopPropagation(); 
		event.preventDefault();
		event.cancelBubble = true;
		window.removeEventListener('mousemove', move, true); 
	} 

	let dragDiv = {}; 

	const move = function(){ 
		if(event.target.classList){
			if(event.target.classList.contains("selectNode")){
				return;
			}
			else if(event.target.classList.contains("titleText")){
				return;
			}
		}
		event.stopPropagation(); 
		event.preventDefault();
		event.cancelBubble = true;
		const thisWidget = WidgetCollection.get(dragDiv.id);
		thisWidget.connectors.forEach(function(key, value, map){
			connectorCollection.get(key).move();
		});
		thisWidget.location.x = event.clientX + offset[0];
		thisWidget.location.y = event.clientY + offset[1];
		dragDiv.style.top = thisWidget.location.y + 'px'; 
		dragDiv.style.left = thisWidget.location.x + 'px'; 
	}

	const mouseDown = function(){ 
		if(event.target.classList){ 
			if(event.target.classList.contains("selectNode")){
				return;
			}
			else if(event.target.classList.contains("titleText")){
				return;
			}
		}
		event.stopPropagation(); 
		event.preventDefault();
		event.cancelBubble = true;
		window.addEventListener('mousemove', move, true); 
		dragDiv = event.target.parentNode; 
		offset = [ dragDiv.offsetLeft - event.clientX, dragDiv.offsetTop - event.clientY ]; 
	}
	 
	const AppInit = function(){ 
		document.onkeydown = bodyKeyDown; // Deals with Delete Key
		document.onmouseup = mouseUp; // Deals with end of drag
		drawToolBarButtons();
	} 

	const polarToCartesian = function(centerX, centerY, radius, angleInDegrees) {
	  const angleInRadians = (angleInDegrees-90) * Math.PI / 180.0;

	  return {
		x: centerX + (radius * Math.cos(angleInRadians)),
		y: centerY + (radius * Math.sin(angleInRadians))
	  }
	}

	const describeArc = function(x, y, radius, startAngle, endAngle){

		const start = polarToCartesian(x, y, radius, endAngle);
		const end = polarToCartesian(x, y, radius, startAngle);

		const largeArcFlag = endAngle - startAngle <= 180 ? "0" : "1";

		const d = [
			"M", start.x, start.y, 
			"A", radius, radius, 0, largeArcFlag, 0, end.x, end.y
		].join(" ");

		return d;       
	}

	AppInit();
})();