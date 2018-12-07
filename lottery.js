console.log('loaded lottery.js');

/* declare constants and defaults */
default_parameters = {
	cost_of_ticket: 2,
	number_of_tickets_per_person:1,
	pool_size: 1,
	number_of_tickets_sold: 30000000,
	average_tickets_per_person: 2,
}

// controls how far into probability we will search
// if too high, will make code very slow and memory-inefficient
significance_z = 2.5;

numeric_list_id = "numeric_options_div";
prob_list_id = "probability_list_table";
prob_list_div_id = "probability_list_div";
plot_id = "plot_div";
text_results_id="text_results_div";

// quantity | pool_size | total_tickets_sold | net_worth | ticket_price
enabled_range_row=3;

// keeps track of counts
invoke_counter = 0;

master_results_list=[];

// display names for different range variables
display_names = {};

/* this can be changed via global parameters */
replace_text_on_click=true;

default_probs = [
	{
		payout:4,
		numerator:1,
		denominator:38.32,
		label: "0W+PB"
	},

	{
		payout:4,
		numerator:1,
		denominator:91.98,
		label: "1W+PB"
	},

	{
		payout:7,
		numerator:1,
		denominator:701.33,
		label: "2W+PB"
	},

	{
		payout:7,
		numerator:1,
		denominator:579.76,
		label: "3W"
	},

	{
		payout:100,
		numerator:1,
		denominator:14494.11,
		label:"3W+PB"
	},

	{
		payout:100,
		numerator:1,
		denominator:36525.17,
		label:"4W"
	},

	{
		payout:50000,
		numerator:1,
		denominator:913129.18,
		label:"4W+PB"
	},

	{
		payout:1000000,
		numerator:1,
		denominator:11688053.52,
		label:"5W"
	},

	{
		payout:50000000,
		numerator:1,
		denominator:292201338,
		jackpot:true,
		label:"5W+PB"
	},
]

/* main code */

// utility functions

function make_text_input(default_value=''){
	// convert undefined to blank
	default_value = default_value ? default_value : '';
	var new_input=$("<input>")
	.attr('type','text')
	.attr('onfocus', "if (replace_text_on_click) {this.value=''}")
	.attr('value',default_value);

	var td_element = $("<td>");
	new_input.appendTo(td_element);

	return td_element;
}

function make_checkbox_input(default_value=''){
	// convert undefined to blank
	default_value = default_value ? default_value : false;
	var new_input=$("<input>")
	.attr('type','checkbox')
	.prop('checked',default_value);

	var td_element = $("<td>");
	new_input.appendTo(td_element);

	return td_element;
}


/* use these to handle metaparameters */

function initialize_metaparameters(){
	//numeric_list_id - name of parent element
	// CURRENT "NET WORTH" - NUMBER OF TICKETS PER PERSON - POOL SIZE - NUMBER OF TICKET BUYERS
	console.log('initializing metaparameter objects');
	var container = $('#' + numeric_list_id);

	var container_table = $('<table>')
	.attr('id', 'metaparameter_table');

	// just the header
	container_table.append(
		'<tr><th>Clear input text on focus</th><th>Ticket price</th><th>Net worth (USD)</th><th>Tickets per person in pool</th><th>Pool size</th><th>Number of other tickets sold</th>'
	)

	// let's add some tooltips

	var th_elements = $($(container_table.find('tr')).find('th'));

	th_elements.addClass('ttooltip');

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('Cost of tickets in USD')
		.appendTo(th_elements[1]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('What is your approximate net worth? This allows the lottery prizes to be put into context')
		.appendTo(th_elements[2]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('How many tickets does each person buy?')
		.appendTo(th_elements[3]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('In a pool, you and other people each buy a number of tickets, and split all the payouts equally. A pool of 1 is just yourself, and a pool of 100 is you and 99 others.')
		.appendTo(th_elements[4]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('This affects how the jackpot is split. It is required even if the jackpot is removed, but it won\'t affect the model.')
		.appendTo(th_elements[5]);	



	var table_input_row = $('<tr>')
	.attr('id','metaparameter_row')
	.appendTo(container_table);

	var clear_input_obj = make_checkbox_input(true)
	.attr('id','clear_input_on_focus')
	.attr('class','metaparameter')
	.on('change', function() {
		replace_text_on_click = $('#clear_input_on_focus > input').prop('checked');
	})
	.appendTo(table_input_row);

	var ticket_cost_obj = make_text_input('2')
	.attr('id','ticket_cost')
	.attr('class','metaparameter')
	.appendTo(table_input_row);

	var net_worth_obj = make_text_input('25000')
	.attr('id','net_worth')
	.attr('class','metaparameter')
	.appendTo(table_input_row);

	var num_tickets_obj = make_text_input('1')
	.attr('id','num_tickets')
	.attr('class','metaparameter')
	.appendTo(table_input_row);

	var pool_size_obj = make_text_input('1')
	.attr('id','pool_size')
	.attr('class','metaparameter')
	.appendTo(table_input_row);

	var num_ticket_buyers = make_text_input('50000000')
	.attr('id','num_ticket_buyers')
	.attr('class','metaparameter')
	.appendTo(table_input_row);

	container_table.appendTo(container);

    console.log('initialized metaparameter objects');
}

function initialize_range_metaparameters(){
	console.log('initializing range metaparameters');

	var range_table = $('<table>')
		.attr('id','range_table')
		.appendTo('#range_options_div');

	// header

	var range_header_row = $('<tr>')
		.attr('id','range_table_header_row')
		.attr('class','range_table_header_row')
		.appendTo(range_table);

	var colnames = ['Variable','Minimum','Maximum','Num. Values','Interval Type','Toggle'];
	for (var i=0; i < colnames.length;i++){
		var colname = colnames[i];
		var new_th = $('<th>')
			.attr('class','range_table_th')
			.attr('id','range_table_th_' + colname)
			.text(colname)
			.addClass('ttooltip')
			.appendTo(range_header_row);

		switch (i){
			case 0:
				$('<span>')
					.attr('class', 'ttooltiptext')
					.text('What variable do you want to calculate multiple expected utilities for?')
					.appendTo(new_th);
				break;
			case 1:
				$('<span>')
					.attr('class', 'ttooltiptext')
					.text('What is the lowest value for this variable with which you want to calculate?')
					.appendTo(new_th);
				break;
			case 2:
				$('<span>')
					.attr('class', 'ttooltiptext')
					.text('What is the highest value for this variable with which you want to calculate?')
					.appendTo(new_th);
				break;
			case 3:
				$('<span>')
					.attr('class', 'ttooltiptext')
					.text('How many different values do you want to calculate?')
					.appendTo(new_th);
				break;
			case 4:
				$('<span>')
					.attr('class', 'ttooltiptext')
					.html('Linear - each value is spaced evenly apart</br></br>Log - the ratio between consecutive values is the same (e.g., doubles each value)')
					.appendTo(new_th);
				break;
			
			case 5:
				$('<span>')
					.attr('class', 'ttooltiptext')
					.text('Click this to switch to the variable on this row.')
					.appendTo(new_th);
				break;
			
		}
	}


	control_param_varnames = [];

	// control ticket quantity, pool size, number of other tickets sold, net worth, and ticket price

	control_parameters = [
		{
			varname:'quantity',
			default_min:1,
			default_max:1000, // 10,000 hurts a lot of systems bc of values between 3,000-8,000
			default_n_intervals:10,
			default_interval_type:'geometric',
			display_name:'Quantity of tickets (per person)',
			prepend:'',
			is_int:true,
		},
		{
			varname:'pool_size',
			default_min:1,
			default_max:500,
			default_n_intervals:10,
			default_interval_type:'geometric',
			display_name:'Pool Size',
			prepend:'',
			is_int: true,
		},
		{
			varname:'total_tickets_sold',
			default_min:1000000,
			default_max:100000000,
			default_n_intervals:10,
			default_interval_type:'geometric',
			display_name:'Total Tickets Sold',
			prepend:'',
			is_int:true,
		},
		{
			varname:'net_worth',
			default_min:10000,
			default_max:1000000,
			default_n_intervals:10,
			default_interval_type:'geometric',
			display_name:'Net Worth',
			prepend:'$',
			is_int:false,
		},
		{
			varname:'ticket_price',
			default_min:0.15,
			default_max:2,
			default_n_intervals:20,
			default_interval_type:'linear',
			display_name:'Ticket Price',
			prepend:'$',
			is_int:false,
		}

	];

	

	// make new slots
	for (var i=0; i < control_parameters.length;i++){



		var control_param = control_parameters[i];
		control_param_varnames.push(control_param['varname']);
		// 
		display_names[control_param['varname']] = control_param['display_name'];

		//console.log(control_param);
		var new_range_row = $("<tr>")
			.attr('id', 'control_div' + control_param['varname'])
			.attr('class','control_row')
			.appendTo(range_table);

		// varname
		var varname_element = $('<td>')
			.attr('class','range_varname_td')
			.text(control_param['display_name'])
			.appendTo(new_range_row);

		// min
		var min_range_element = make_text_input('' + control_param['default_min']) 
			.attr('class', 'range_input min_input')
			.prepend(control_param['prepend'])
			.appendTo(new_range_row);

		// max
		var max_range_element = make_text_input('' + control_param['default_max']) 
			.attr('class', 'range_input max_input')
			.prepend(control_param['prepend'])
			.appendTo(new_range_row);

		// n_intervals
		var n_intervals_element = make_text_input('' + control_param['default_n_intervals']) 
			.attr('class', 'range_input n_intervals_input')
			.appendTo(new_range_row);

		// interval type
		var interval_type_td = $('<td>')
			.attr('class','range_input interval_type_input')
			.appendTo(new_range_row);

		var linear_input_div = $('<div>')
			.attr('id','linear_input_' + control_param['varname'] + '_div')
			.attr('class','radio_input_div')
			.appendTo(interval_type_td);

		var linear_input_radio = $('<input>')
			.attr('class', 'interval_type_radio_input')
			.attr('type','radio')
			.attr('name','interval_type_' + control_param['varname'])
			.attr('id','interval_type_linear_' + control_param['varname'])
			.attr('value','linear')
			.appendTo(linear_input_div);

		var linear_input_label = $('<label>')
			.attr('class','interval_type_label')
			.attr('for','interval_type_linear_' + control_param['varname'])
			.text('Linear')
			.appendTo(linear_input_div);

		var geometric_input_div = $('<div>')
			.attr('id','geometric_input_' + control_param['varname'] + '_div')
			.attr('class','radio_input_div')
			.appendTo(interval_type_td);

		var geometric_input_radio = $('<input>')
			.attr('type','radio')
			.attr('class', 'interval_type_radio_input')
			.attr('name','interval_type_' + control_param['varname'])
			.attr('id','interval_type_geometric_' + control_param['varname'])
			.attr('value','geometric')
			.appendTo(geometric_input_div);

		var geometric_input_label = $('<label>')
			.attr('class','interval_type_label')
			.attr('for','interval_type_geometric_' + control_param['varname'])
			.text('Log')
			.appendTo(geometric_input_div);

		// select default type
		if (control_param['default_interval_type'] == 'linear'){
			linear_input_radio.prop('checked', true);
		}
		else{
			geometric_input_radio.prop('checked', true);
		}

		// toggle
		var toggle_radio_td = $('<td>')
			.attr('class','toggle_radio_td')
			.appendTo(new_range_row);

		var toggle_radio = $('<input>')
			.attr('type','radio')
			.attr('class','toggle_radio')
			.attr('id', 'toggle_' + control_param['varname'])
			.attr('name', 'range_toggle_radio_buttons')
			.on('change', function() {
				//if ($(this).prop('checked')){
				$('.range_toggle_checkbox > input').not($(this).find('input')).prop('checked',false);
				// change the row that is toggled
				$(this).closest('tr').removeClass('disabled_row').prop('disabled',false);
				$($(this).closest('tr').find('input')).prop('disabled',false);
				$('.control_row').not($(this).closest('tr')).addClass('disabled_row');
				$('.disabled_row > td > input:text').prop('disabled',true);
				$('.disabled_row > td > div > input:radio').prop('disabled',true);
			})
			.appendTo(toggle_radio_td);

		if (i == enabled_range_row){
			toggle_radio.prop('checked', true);
		}
		else{
			new_range_row.addClass('disabled_row');
			$(new_range_row.find('input:text')).prop('disabled',true);
			$(new_range_row.find('input.interval_type_radio_input')).prop('disabled', true);
		}
		/*
		var toggle_checkbox = make_checkbox_input(false)
			.attr('class','range_toggle_checkbox')
			.attr('id','range_toggle_checkbox_'+control_param['varname'])
			.on('change', function() {
				//if ($(this).prop('checked')){
				$('.range_toggle_checkbox > input').not($(this).find('input')).prop('checked',false);
				// change the row that is toggled
				$(this).closest('tr').removeClass('disabled_row').prop('disabled',false);
				$('.control_row').not($(this).closest('tr')).addClass('disabled_row');
				$('.disabled_row > td > input:text').prop('disabled',true);
				$('.disabled_row > td > div > input:radio').prop('disabled',true);
			})
			.appendTo(new_range_row);
		*/
	}

	console.log('initialized range metaparameters');
}

/* use these to update the prob table/list */

function initialize_prob_frames(){
	/*called once*/
	console.log('initilizing default probabilities');

	// let's make some helper text

	var prob_table = $('#probability_list_table');
	var th_elements = $(prob_table.find('th'));

	th_elements.addClass('ttooltip');

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('The description of the prize. This does not affect the model, but is here for convenience, as well as part of any data downloaded')
		.appendTo(th_elements[0]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('Numerator of fraction describing probability.')
		.appendTo(th_elements[1]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('Denominator of fraction describing probability.')
		.appendTo(th_elements[2]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('If you win this prize, what is its value?')
		.appendTo(th_elements[3]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('If checked, then this means that this prize can be only won once, and can be split among multiple winners')
		.appendTo(th_elements[4]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('This is the probability of winning this times the payout, aka its expected value. Adding all of these yields the overall expected value for the ticket.')
		.appendTo(th_elements[5]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('What proportion of the expected value of each ticket is from this specific prize?')
		.appendTo(th_elements[6]);

	$('<span>')
		.attr('class', 'ttooltiptext')
		.text('What is the likelihood of winning this times its effect on your overall utility? This will always be positive, provided the payout is more than the ticket price. This gives you a general sense of what prizes you should "hope" for when playing')
		.appendTo(th_elements[7]);


	for (var i = 0; i<default_probs.length; i++){
		make_prob_frame(default_probs[i]);
	}

	make_prob_append_button()
	.appendTo($('#' + prob_list_div_id));

	console.log('initialized default probabilities');
}


function make_prob_frame(data){
	//console.log(data);
	/*
	  LABEL (optional) | 
	  numerator (text input; default 1) | 
	  denominator (text input) | 
	  is_jackpot (checkbox)
	*/

	var frame_no = $.find('.prob_frame').length - 1;

	//console.log(frame_no);

	var frame_id = 'prob_frame_' + frame_no.toString();

	var new_frame = $("<tr>")
	.attr('class', 'prob_frame')
	.attr('id', frame_id);

	// probability labels

	var label_obj = make_text_input(data['label']);

	label_obj
	.attr('class','prob_label prob_input')
	.appendTo(new_frame);

	// numerator

	var numerator_obj = make_text_input(data['numerator'])
	.attr('class','numerator prob_input')
	.appendTo(new_frame);

	// denominator
	var denominator_obj = make_text_input(data['denominator'])
	.attr('class','denominator prob_input')
	.appendTo(new_frame);

	// payout
	var payout_obj = make_text_input(data['payout'])
	.attr('class','payout prob_input')
	.appendTo(new_frame);

	payout_obj.prepend('$');

	// jackpot indicator
	var jackpot_obj = make_checkbox_input(data['jackpot'])
	.attr('class','jackpot')
	.on('change', function() {
		$('.jackpot > input').not($(this).find('input')).prop('checked',false);
	})
	.appendTo(new_frame);

	// value slot
	var value_slot = $('<td>')
	.attr('class', 'value_slot')
	.appendTo(new_frame);

	// value pct slot
	var value_slot = $('<td>')
	.attr('class', 'value_pct_slot')
	.appendTo(new_frame);
	// individual utility slot
	var value_slot = $('<td>')
	.attr('class', 'individual_utility_slot')
	.appendTo(new_frame);

	// delete button
	var delete_button_td = $('<td>')
	.attr('class','delete_button_td')
	.appendTo(new_frame);

	var delete_button_obj = $('<button>')
	.text('X')
	.attr('class','delete_button')
	.on('click', function() {
		$(this).closest('tr').remove();
	})
	.appendTo(delete_button_td);

	new_frame.appendTo('#' + prob_list_id);

	return 0;

}

function make_prob_append_button(){
	/* should be called once */
	var new_button = $("<button>")
	.attr('id','make_new_frame_button')
	.attr('class', 'make_new_frame_button')
	.on('click', function(){
		make_prob_frame(
			{
				numerator: 1,
				payout: '0',
				denominator: 999
			}
		);
	}).
	text('+');

	new_div = $('<div>')
	.attr('id', 'prob_append_button_div')

	new_button.appendTo(new_div);
	return new_div
}

//obsolete
function delete_prob_frame(){

}

// called after calculation
function update_prob_frame(){

}

/* use these to handle the graph */


function create_graph(){
	/*called once*/

}

function update_graph(){

}

/* for the text-based description at bottom */

function create_text_description(){
	/*called once*/
	create_calculation_button();
}

function create_calculation_button(){
	var calculate_button = $('<button>')
	.attr('id','calculate_button')
	.appendTo('#calculate_button_div')
	.text('Calculate Expected Value & Utility')
	.on('click', calculate_button_press);
}

function create_range_calculation_button(){
	var range_calculation_button = $('<button>')
	.attr('id','range_calculate_button')
	.appendTo('#range_calculate_button_div')
	.text('Calculate utility for range')
	.on('click',calculate_range_button_press);
}

function update_text_description(){

}

/* calculations */

function calculate_ev(row){
	// takes a single <tr> jquery object 
	var numerator = parseFloat($(row.find('.numerator > input')).val());
	var denominator = parseFloat($(row.find('.denominator > input')).val());
	var probability = numerator/denominator;
	var payout = parseFloat($(row.find('.payout > input')).val());

	return probability * payout
}


// this reloads the data and performs simple calculations describing the effect of 
// each individual row, as well as returning scalar expected value
function calculate_overall_ev(quantity, pool_size, net_worth, 
	total_tickets_sold, unit_cost, log_exponent=10){

	var prob_frames = $.find('.prob_frame');
	var n_frames = prob_frames.length;
	console.log(pool_size);
	
	// copied from another function
	var probability_data = [];
	for (var i = 0; i < n_frames; i++){
		var row = $(prob_frames[i]);
		var numerator = parseFloat($(row.find('.numerator > input')).val());
		var denominator = parseFloat($(row.find('.denominator > input')).val());
		var probability = numerator/denominator;
		
		var payout = parseFloat($(row.find('.payout > input')).val());
		var is_jackpot = $(row.find('.jackpot > input')).is(':checked');
		console.log(is_jackpot);

		console.log(payout);


		// make adjustments based on parameters
		var new_probability = probability * pool_size * quantity;
		var new_payout = payout / pool_size;

		probability_data.push(
		{
			probability:probability,
			payout:payout,
			new_payout:new_payout,
			expected_value: new_payout * new_probability,
			is_jackpot:is_jackpot,
			// use to determine how samples will be calculated
			expected_count: quantity * pool_size * probability,
			sd_count: Math.sqrt(quantity * pool_size * probability * (1-probability))
		}
		)


	}
	var grouped_prob_data = determine_prob_types(probability_data, quantity, pool_size, 
		net_worth, total_tickets_sold, unit_cost, log_exponent
	);

	//pool size has no effect on final calculation
	//scalar
	var expected_value = -quantity * unit_cost;
	//ev of each row
	var row_expected_values = [];
	//expected utility if one ticket of a row was purchased (+ contribution)
	var row_expected_utilities = [];
	// proportion of EV for a given row (calculated last)
	var row_value_proportions = [];


	for (var i = 0; i < probability_data.length; i++){
		entry = probability_data[i];
		if (entry['is_jackpot']){
			var jackpot_probs = grouped_prob_data['jackpot'];
			var jackpot_ev = 0;
			var jackpot_utility = 0;
			for (var j = 0; j < jackpot_probs.length; j++){
				var jentry = jackpot_probs[j];
				var jprob = jentry['probability'];
				var jpayout = jentry['payout'];
				jackpot_ev += jprob*jpayout;
				jackpot_utility+=jentry['probability'] * (log(jpayout + net_worth-unit_cost, log_exponent) -
					log(net_worth, log_exponent)
				);
			}
			var row_expected_value = jackpot_ev;
			var row_expected_utility = jackpot_utility;
		}
		else{
			var row_expected_value = entry['probability'] * entry['payout'];
			var row_expected_utility = entry['probability'] * (log(entry['payout'] + net_worth - unit_cost, log_exponent) -
				log(net_worth, log_exponent)
			);
		}
		row_expected_values.push(row_expected_value);
		row_expected_utilities.push(row_expected_utility);
	}

	var sum_ev = row_expected_values.reduce((a,b) => a+b, 0);
	expected_value+= quantity*sum_ev;
	row_value_proportions = row_expected_values.map(x => x/sum_ev);

	invoke_counter+=1
	return {
		expected_value:expected_value,
		individual_expected_value:expected_value/quantity,
		sum_expected_value:sum_ev*quantity,
		row_expected_values:row_expected_values,
		row_expected_utilities:row_expected_utilities,
		row_value_proportions:row_value_proportions,
		trial_id: invoke_counter,
	}

}

function calculate_button_press(){
	var unit_cost = parseFloat($($.find('#ticket_cost > input')).val());
	var quantity = parseInt($($.find('#num_tickets > input')).val());
	var net_worth = parseFloat($($.find('#net_worth > input')).val());
	var pool_size = parseInt($($.find('#pool_size > input')).val());
	var total_tickets_sold = parseInt($($.find('#num_ticket_buyers > input')).val());


	//validate and re-highlight if there are errors
	console.log('validating...');
	var is_invalid = validate_input_parameters(unit_cost, quantity, net_worth, pool_size, total_tickets_sold);

	if (is_invalid){
		console.log('invalid input.');
		return 1;
	}
	console.log('validated.');
	var notification=$('<div>')
		.attr('class','calculation_div')
		.attr('id','calculation_notification')
		.text('Making calculations, please wait...')
		.appendTo($('#text_results_div'))
		.redraw();
	
	$('#text_results_div').hide().show(0);
	console.log('reg button press');
	var results = calculate_log_ev(unit_cost, quantity, net_worth, total_tickets_sold, pool_size);


}


function calculate_range_button_press(){
	/* starts off similar to calculate_button_press */
	var unit_cost = parseFloat($($.find('#ticket_cost > input')).val());
	var quantity = parseInt($($.find('#num_tickets > input')).val());
	var net_worth = parseFloat($($.find('#net_worth > input')).val());
	var pool_size = parseInt($($.find('#pool_size > input')).val());
	var total_tickets_sold = parseInt($($.find('#num_ticket_buyers > input')).val());


	//validate and re-highlight if there are errors
	console.log('validating...');
	var is_invalid = validate_input_parameters(unit_cost, quantity, net_worth, pool_size, total_tickets_sold);
	var range_validation_data = validate_range_input_parameters(unit_cost, quantity, net_worth, pool_size, total_tickets_sold);
	if (typeof range_validation_data == 'boolean')
		is_invalid = is_invalid | range_validation_data;

	if (is_invalid){
		console.log('invalid input.');
		return 1;
	}
	console.log('validated.');
	var notification=$('<div>')
		.attr('class','calculation_div')
		.attr('id','range_calculation_notification')
		.text('Making calculations, please wait...')
		.appendTo($('#range_calculate_button_div'))
		.redraw();
	
	//$('#text_results_div').hide().show(0);
	console.log('range calculations...');

	// load range_validation_data and other iterable lists
	var pool_size_list = [pool_size];
	var quantity_list = [quantity];
	var unit_cost_list = [unit_cost];
	var net_worth_list = [net_worth];
	var total_tickets_sold_list = [total_tickets_sold];
	var varname = range_validation_data['varname'];
	var values = range_validation_data['values'];

	switch(varname){
		case 'pool_size':
			pool_size_list = values;
			break;
		case 'quantity':
			quantity_list = values;
			break;
		case 'ticket_price':
			unit_cost_list = values;
			break;
		case 'net_worth':
			net_worth_list = values;
			break;
		case 'total_tickets_sold':
			total_tickets_sold_list = values;
			break;
		default:
			console.log('Error with varname switch statement...');
			return 1;
	}
	

	var disable_output=true;

	// global for download button
	results_list = [];
	// yes, 5 nested loops is annoying, but it's extensible later, and 
	// doesn't change the 
	for (var i=0; i<quantity_list.length; i++){
		for (var j=0; j<pool_size_list.length; j++){
			for (var k=0; k<total_tickets_sold_list.length; k++){
				for (var l=0;l<net_worth_list.length;l++){
					for (var m=0; m<unit_cost_list.length; m++){
						var results = calculate_log_ev(unit_cost_list[m], quantity_list[i], 
							net_worth_list[l], 
							total_tickets_sold_list[k], pool_size_list[j],
							undefined,
							disable_output=disable_output);
						results_list.push(results);
					}
				}
			}
		}
	}
	var model_data = {
		results_list: results_list,
		range_params: range_validation_data,
	}
	console.log(model_data);

	// clear wait notification
	$('#range_calculation_notification').remove();

	// plot data
	plot_model_data(model_data);

	$('#plot_div').scrollView();

	// return 
	return 0;
	
}

function validate_input_parameters(unit_cost, quantity, net_worth, pool_size, total_tickets_sold){
	// clear previous styles
	$('.metaparameter > input:text').css('background-color','white');
	$('.prob_input > input:text').css('background-color','white');
	var is_invalid = false;
	// validate metaparameters
	if (unit_cost === undefined | isNaN(unit_cost)){
		$('#ticket_cost > input:text').css('background-color','pink');
		is_invalid = true;
	}
	if (quantity === undefined | isNaN(quantity)){
		$('#num_tickets > input:text').css('background-color','pink');
		is_invalid = true;
	}
	if (net_worth === undefined | isNaN(net_worth)){
		$('#net_worth > input:text').css('background-color','pink');
		is_invalid = true;
	}
	if (pool_size === undefined | isNaN(pool_size)){
		$('#pool_size > input:text').css('background-color','pink');
		is_invalid = true;
	}
	if (total_tickets_sold === undefined | isNaN(total_tickets_sold) ){
		$('#num_tickets > input:text').css('background-color','pink');
		is_invalid = true;
	}
	if (unit_cost * quantity >= net_worth){
		$('#net_worth > input:text').css('background-color','pink');
		$('#num_tickets > input:text').css('background-color','pink');
		$('#ticket_cost > input:text').css('background-color','pink');
		is_invalid = true;
	}

	// validate probs
	var prob_frames = $('.prob_frame');
	for (var i = 0; i < prob_frames.length; i++){
		//numerator
		var frame = $(prob_frames[i]);
		var numerator = $(frame.find('.numerator > input'));
		if (parseFloat(numerator.val()) === undefined | isNaN(parseFloat(numerator.val()))){
			is_invalid = true;
			frame.find('.numerator > input').css('background-color','pink');
		}
		//denominator
		var denominator = $(frame.find('.denominator > input'));
		if (parseFloat(denominator.val()) === undefined | isNaN(parseFloat(denominator.val()))){
			is_invalid = true;
			frame.find('.denominator > input').css('background-color','pink');
		}

		//payout
		var payout = $(frame.find('.payout > input'));
		if (parseFloat(payout.val()) === undefined | isNaN(parseFloat(payout.val()))){
			is_invalid = true;
			frame.find('.payout > input').css('background-color','pink');
		}
	}

	// return if any errors
	return is_invalid;
}

function validate_range_input_parameters(unit_cost, quantity, net_worth, pool_size, total_tickets_sold){
	// clear previosu highlighting
	$($('#range_table').find('input:text')).css('background-color','');

	//determine row
	var rows_checked = $('.toggle_radio').map(function(e){ return $(this).prop('checked');})
	var row_num = rows_checked.index(true);
	if (row_num == -1){
		console.log('radio buttons broken...');
		return true;
	}
	var is_invalid = false;
	var control_param = control_parameters[row_num];
	var int_required = control_param['is_int'];

	var table_row = $($('.control_row')[row_num]);

	var interval_type = $(table_row.find('.interval_type_radio_input')[0]).prop('checked') ? 'linear' : 'geometric';
	console.log('interval type: ' + interval_type);

	// make sure min, max are positive floats
	var min_val = $(table_row.find('.min_input > input')).val();
	var max_val = $(table_row.find('.max_input > input')).val();
	var n_vals = $(table_row.find('.n_intervals_input > input')).val();

	if (int_required){
		var parsed_min_val = parseInt(min_val);
		var parsed_max_val = parseInt(max_val);
	}
	else{
		var parsed_min_val = parseFloat(min_val);
		var parsed_max_val = parseFloat(max_val);
	}
	var parsed_n_vals = parseFloat(n_vals);
	// var-specific
	var varname = control_param['varname'];
	var min_failure = false;
	var max_failure = false;

	if (varname == 'quantity' & (parsed_min_val < 1)){
		min_failure=true;
	}
	else if (varname == 'pool_size' & (parsed_min_val < 1)){
		min_failure=true;
	}
	else if (varname=='net_worth' & (unit_cost * quantity >= parsed_min_val)){
		min_failure=true;
	}

	if (interval_type=='geometric' & parsed_min_val <= 0){
		// must have positive values for geometric scale
		min_failure=true;
	}

	if (varname == 'quantity' & (parsed_max_val * unit_cost >= net_worth)){
		max_failure = true;
	}
	else if (varname=='unit_cost' & (parsed_max_val * quantity >= net_worth)){
		max_failure=true;
	}
	else if (varname=='net_worth' & (unit_cost * quantity >= parsed_max_val)){
		max_failure=true;
	}

	// make sure min < max
	if (isNaN(parsed_min_val) | parsed_min_val>= parsed_max_val | parsed_min_val < 0 | min_failure){
		$(table_row.find('.min_input > input')).css('background-color', 'pink');
		is_invalid=true;
	}
	if (isNaN(parsed_max_val) | parsed_min_val >= parsed_max_val | parsed_max_val < 0 | max_failure){
		$(table_row.find('.max_input > input')).css('background-color', 'pink');
		is_invalid=true;
	}

	// make sure num. values is +integer greater than 1
	if (isNaN(parsed_n_vals) | parsed_n_vals <= 1){
		$(table_row.find('.n_intervals_input > input')).css('background-color', 'pink');
		is_invalid=true;
	}

	// formulate actual range of data to return


	var values=[];

	if (interval_type == 'linear'){
		var difference = parsed_max_val - parsed_min_val;
		var interval_size = difference/(parsed_n_vals-1);
		values = [...Array(parsed_n_vals).keys()].map(
			function(e, i){return parsed_min_val + interval_size * (e);}
		)
	}
	else{
		var scale = parsed_max_val/parsed_min_val;
		var interval_factor = Math.pow(scale, 1/(parsed_n_vals-1))
		values = [...Array(parsed_n_vals).keys()].map(
			function(e, i){return parsed_min_val * Math.pow(interval_factor, (e));}
		)
	}

	// round ints
	if (int_required){
		values = values.map(function(e, i){return Math.round(e);})
	}
	//remove duplicates
	for (var i = values.length-1; i>0; i--){
		if (values[i]==values[i-1]){
			values.splice(i, 1);
		}
	}
	

	return {
		values:values,
		interval_type:interval_type,
		varname:varname,
		n_values:values.length,
	};
}

function calculate_log_ev(unit_cost, quantity,  net_worth, total_tickets_sold, 
	pool_size=1, log_exponent=10, disable_output=false){
	/*
	unit_cost = cost of one ticket/bet
	quantity = number of tickets (per person in pool) purchased
	net_worth = net worth of individual purchasing
	pool_size = number of people buying a ticket in a lottery pool
	log_exponent = number to use as base for log function

	*/
	//console.log('disable output?');
	//console.log(disable_output);
	start_time = Date.now();

	var prob_frames = $.find('.prob_frame');
	var n_frames = prob_frames.length;
	//console.log(pool_size);
	
	var probability_data = [];
	for (var i = 0; i < n_frames; i++){
		var row = $(prob_frames[i]);
		var numerator = parseFloat($(row.find('.numerator > input')).val());
		var denominator = parseFloat($(row.find('.denominator > input')).val());
		var probability = numerator/denominator;
		//console.log(numerator);
		//console.log(probability);
		
		var payout = parseFloat($(row.find('.payout > input')).val());
		var is_jackpot = $(row.find('.jackpot > input')).is(':checked');
		//console.log(is_jackpot);

		//console.log(payout);


		// make adjustments based on parameters
		var new_probability = probability * pool_size * quantity;
		var new_payout = payout / pool_size;

		probability_data.push(
		{
			probability:probability,
			payout:payout,
			new_payout:new_payout,
			expected_value: new_payout * new_probability,
			is_jackpot:is_jackpot,
			// use to determine how samples will be calculated
			expected_count: quantity * pool_size * probability,
			sd_count: Math.sqrt(quantity * pool_size * probability * (1-probability))
		}
		)


	}
	//console.log('total t sold 2: ' + total_tickets_sold);
	var grouped_prob_data = determine_prob_types(probability_data, quantity, pool_size, 
		net_worth, total_tickets_sold, unit_cost, log_exponent
	);
	if (!disable_output){
		console.log(grouped_prob_data);
	}
	return calculate_log_ev_from_grouped_prob_data(grouped_prob_data, 
		unit_cost, quantity, pool_size,
		net_worth, total_tickets_sold, log_exponent, disable_output=disable_output
	);

}

function determine_prob_types(data, quantity, pool_size, net_worth, 
	total_tickets_sold, unit_cost, log_exponent){
	// divide the results into 3 groups:
	// high-expected value (can approximate return with single number)
	// low expected value (calculate max # of times could appear based on prob/EV compared to others)
	// intermediate expected value (similar to above 2 but for low counts of tickets)

	var expected_value = 0;
	var n_frames = data.length;

	// I messed up variable naming, and for now I use total_tickets_other to describe the number
	// of tickets that others have purchased, and total_tickets_sold for the number
	// purchased by the pool the user is in 
	var total_tickets_other = total_tickets_sold;
	total_tickets_sold = quantity * pool_size;

	//keep track of probability of events
	var min_probability = get_min(data, 'probability');

	var min_ev = get_min(data, 'expected_value');

	var sum_ev = get_sum(data, 'expected value');
	var sum_prob = get_sum(data, 'probability');

	// do not increase number of trials needed
	var high_ev_probs = [];
	// increase number of trials needed by arbitrary factor
	var intermediate_ev_probs = [];
	// "only" doubles number of trials needed due to low probability
	var low_ev_probs = [];
	// increases by factor of list length; only one of these is possible, realistically
	var very_low_ev_probs = [];
	// increases by factor of list length; multiple possible behaviors
	var jackpot_probs = [];

	// keep track to see what chances of whiff are
	var total_probability = 0;

	var jackpot_probability = NaN;

	// let's classify each different aspect of probability
	for (var i=0; i<data.length; i++){
		var entry = data[i];
		var payout = entry['payout'];
		total_probability+=entry['probability'];
		//special treatment for jackpot
		if (entry['is_jackpot']){
			// calculate on spot what the possible splits are and split the possibilities
			// follow binomial distribution of p = probability, n = number of tickets sold
			var expected_jackpot_tickets = entry['probability'] * total_tickets_other;
			var probability = entry['probability'];
			jackpot_probability = entry['probability'];
			var expected_jackpot_tickets_sd = Math.sqrt(entry['probability']*(1-entry['probability']) * 
				total_tickets_other);
			console.log('expected jackpot tickets: ' + expected_jackpot_tickets);
			console.log('total tickets sold!: ' + total_tickets_other);

			// not too many expected
			if (expected_jackpot_tickets + significance_z*expected_jackpot_tickets_sd < 15){
				//console.log('hello');
				console.log(expected_jackpot_tickets);
				console.log(expected_jackpot_tickets_sd);
				for (var j = 0; j < Math.ceil(expected_jackpot_tickets + significance_z*expected_jackpot_tickets_sd + 1); j++){
					// probably a degenerate case
					if (j > total_tickets_other){
						break
					}
					var p = entry['probability'];
					//console.log('probability ' + p);
					var binomial_probability = Math.pow(10,
						lcalculate_binomial_probability(total_tickets_other, j, p)
					);
					console.log('' + binomial_probability + ' | ' + min_probability);
					//Math.pow(p, j) * Math.pow(1-p, total_tickets_sold-j) * choose(total_tickets_sold, j);
					if (binomial_probability > min_probability/100 | jackpot_probs.length == 0){
						// the new 
						var new_jackpot_entry = {
							payout: entry['payout']/(1+j),
							probability: binomial_probability * p,
							is_jackpot: true,
							relative_probability: binomial_probability,
						};

						jackpot_probs.push(new_jackpot_entry);
					}
				}
			}
			else if (expected_jackpot_tickets_sd/expected_jackpot_tickets > 0.1){
				// intermediate prob treatment - mostly a copy/paste
				// calculate bounds; extra offset of 1 added for rounding issues
				// calculate minimum count
				var mean_count = expected_jackpot_tickets;
				var sd_count = expected_jackpot_tickets_sd;
				var min_count = Math.floor(Math.max(0, mean_count - significance_z*sd_count -1));

				// calculate maximum likely count
				var max_count = Math.floor(Math.min(total_tickets_other, mean_count + significance_z*sd_count + 1));
				// note that a lot of probability space can get cut out from this approximation
				// extra probability will be added to the endpoints based on the amount missing

				// in this scenario, probabilities are calculated as logarithms due to the simplification
				// from utilizing the log of binomial probabilities
				var sum_intermediate_probability = 0;
				var case_probabilities = [];
				for (var i=min_count; i <= max_count; i++){
					var case_probability = lcalculate_binomial_probability(
						total_tickets_other, i, probability 
					);
					case_probabilities.push(case_probability);
					sum_intermediate_probability+=Math.pow(10, case_probability);
				}
				//console.log(case_probabilities);
				// hackerman
				//console.log(sum_intermediate_probability);
				if (sum_intermediate_probability < 1){
					// may use this later on
					//console.log('fixing probs...');
					//console.log(sum_intermediate_probability);
					var leftover_prob = 1-sum_intermediate_probability;
					// var skewness = (1-2*probability)/Math.sqrt(remaining_tickets * probability*(1-probability));
					if (min_count > 0 & max_count < total_tickets_other){
						case_probabilities[0]['prob']=log(
							Math.pow(10, case_probabilities[0]['prob']) + leftover_prob/2
						);
						case_probabilities[case_probabilities.length-1]['prob']=log(
							Math.pow(10, case_probabilities[case_probabilities.length-1]['prob']) + leftover_prob/2
						);
					}
					else if (min_count == 0){
						case_probabilities[case_probabilities.length-1]['prob']=log(
							Math.pow(10, case_probabilities[case_probabilities.length-1]['prob']) + leftover_prob/2
						);
					}
					else{
						case_probabilities[0]['prob']=log(
							Math.pow(10, case_probabilities[0]['prob']) + leftover_prob
						);
					}
				}

				for (var i=0; i < case_probabilities.length; i++){

					var case_probability = case_probabilities[i];
					//binomial_coefficient * binomial_probability;
					//console.log([i, probability]);
					// no point in propagating zero probs
					if (case_probability <= -20){
						continue;
					}
					if (isNaN(case_probability)){
						console.log([total_tickets_other, min_count+i, payout, probability]);
					}

					jackpot_probs.push({
						payout:entry['payout']/(1+i+min_count),
						probability:quantity * pool_size * entry['probability'] * Math.pow(10, case_probability),
						is_jackpot:true,
						relative_probability: Math.pow(10, case_probability)

					});
				}
			}
			// very large split of many (kind of a degenerate situation, but may happen)
			// "probably" approximates well
			else{
				var new_jackpot_entry = {
					payout: entry['payout']/(1+expected_jackpot_tickets),
					probability: quantity*pool_size * entry['probability'],
					is_jackpot: true,
					relative_probability: 1,
				}
				jackpot_probs.push(new_jackpot_entry);
			}

			//jackpot_probs.push(entry);
			continue;
		}

		// is count big enough (and sd small enough) to consider more or less absolute?
		
		var is_big = entry['expected_count'] > 10;
		var is_significant = entry['sd_count']/(entry['expected_count']) < 0.1;

		if (is_big & is_significant){
			high_ev_probs.push(entry);
			continue;
		}

		//check if very low probability/EV
		var is_super_low_probability = entry['probability'] < 1e-5;
		var has_very_low_expected_count = entry['expected_count'] < 0.001;
		if (has_very_low_expected_count & is_super_low_probability){
			very_low_ev_probs.push(entry);
			continue;
		}

		// check if expected count + 1.96*expected_count_sd <= 1.01; if so, then
		// only consider occurrence of once

		var upper_count_ev = entry['expected_count'] + significance_z * entry['expected_count_sd'];
		if (upper_count_ev <= 1.01){
			low_ev_probs.push(entry);
			continue;
		}

		// intermediate probs need some constraining to avoid runaway behavior
		// need to add extra attributes/keys
		intermediate_ev_probs.push(entry);

	}

	return {
		very_low: very_low_ev_probs,
		low: low_ev_probs,
		intermediate: intermediate_ev_probs,
		high: high_ev_probs,
		jackpot: jackpot_probs,
		probability_success:total_probability,
		probability_whiff:1-total_probability,
		jackpot_probability:jackpot_probability
	}

}

function calculate_log_ev_from_grouped_prob_data(grouped_prob_data, unit_cost, quantity, pool_size, 
	net_worth, total_tickets_sold, log_exponent,disable_output=false){
	var total_tickets = pool_size * quantity;
	var total_cost = unit_cost * quantity;

	// very_low - only assume one of these will happen at most
	// jackpot - can only happen once, but can be split multiple ways if it does happen
	// low - happens maximum of once
	// intermediate - only a few values likely per 
	// high - just use mean estimate
	/* 
	ALGORITHM:
	
	very_low, low, and intermediate are all directly calculated

	high is automatically added as a given for each combination

	O(N(very_low)) * O(N(jackpot)) * O(2^N(low)) * O(C(intermediate)) * O(1 (high))
	*/

	// calculate probability of payout=0 for very_low, low, and intermediate (jackpot already calculated)

	// now let's make the calculation
	var expected_utility = 0;

	// create constant change based on cost of tickets + expected rewards from high-prob tickets
	var base_cost = unit_cost * quantity;

	var default_net_change = -base_cost;

	for (var i = 0; i < grouped_prob_data['high'].length; i++){
		default_net_change += grouped_prob_data['high'][i]['expected_count'] * 
		grouped_prob_data['high'][i]['payout']/pool_size
	}

	// now call recursive function
	var calculated_values = lrecursive_value_calculation(
		0, default_net_change, total_tickets, 1.,
		grouped_prob_data['very_low'],grouped_prob_data['low'], grouped_prob_data['intermediate'], 
		grouped_prob_data['jackpot'],
		pool_size
	);

	// iterate over calculated probs & results
	// exponentiate log probability
	var sum_prob = 0; // DEBUG VAR
	for (var i = 0; i < calculated_values.length; i++){
		sum_prob += Math.pow(10, calculated_values[i]['prob']);
		expected_utility+=Math.pow(10, calculated_values[i]['prob']) * log(net_worth + calculated_values[i]['net'], log_exponent);
	}
	// remainder just default around expected value
	
	var expected_value_data = calculate_overall_ev(
		quantity, pool_size, net_worth, 
		total_tickets_sold, unit_cost, log_exponent
	);
	
	//expected_utility+=(1-sum_prob) *  log(net_worth + expected_value);
	expected_utility/=sum_prob;

	// finalize
	var expected_utility_change = expected_utility - log(net_worth, log_exponent);
	if (!disable_output){
		console.log(sum_prob);
		console.log(expected_utility_change);
		console.log(calculated_values);
		console.log('ev data');
		console.log(expected_value_data);
	}
	global_cv = calculated_values;

	// make text updates

	//ev text
	var expected_value_text = 'Expected value of purchasing tickets is $' + 
		expected_value_data['expected_value'].toFixed(2).toString();
	var ev = expected_value_data['expected_value'];
	if (ev < 0)
		var ev_color = 'firebrick';
	else if (ev > 0)
		var ev_color = 'forestgreen';
	else
		var ev_color = 'black';

	//eu text
	var expected_utility_percentage = Math.pow(log_exponent, expected_utility_change);
	var expected_utility_magnitude = Math.ceil(Math.abs(log(expected_utility_percentage-1, log_exponent)));
	if (Math.sign(expected_utility_change) == 1){
		var percent_number = 100*(expected_utility_percentage - 1);
		percent_number = percent_number.toExponential(4);
		var expected_utility_text = 'Expected utility is an increase of ' + percent_number + '% of wealth' + 
			' ($' + numberWithCommas((expected_utility_percentage-1)*net_worth, 3) + ')';
		var eu_color = 'forestgreen';
	}
	else if (Math.sign(expected_utility_change) == -1){
		var percent_number = -100*(expected_utility_percentage - 1);
		percent_number = percent_number.toFixed(6);
		var expected_utility_text = 'Expected utility is a decrease of ' + percent_number + '% of wealth' + 
			' ($' + numberWithCommas((expected_utility_percentage-1)*net_worth, 3) + ')';
		var eu_color = 'firebrick';
	}
	else{
		var expected_utility_text = "No meaningful change in expected utility (0% | 0.0 units)";
		var eu_color='black';
	}

	
	if (!disable_output){
		$('#text_results_div').html('');
		var ev_text_div = $('<div>')
		.attr('id','ev_div')
		.text(expected_value_text)
		.appendTo('#text_results_div')
		.css('color',ev_color);

		var eu_text_div = $('<div>')
		.attr('id','eu_div')
		.text(expected_utility_text)
		.appendTo('#text_results_div')
		.css('color', eu_color);

		// make tabular viz updates

		var max_utility = d3.max(expected_value_data['row_expected_utilities']);
		var value_divs = d3.selectAll('.value_slot');

		value_divs.each(function(d, i){
			d3.select(this)
				.html('')
				.append('div')
				.attr('class', 'tile_label')
				.text('$' + expected_value_data['row_expected_values'][i].toFixed(3));
		});

		var value_pct_divs = d3.selectAll('.value_pct_slot');

		value_pct_divs.each(function(d, i){
			fill_div_horizontally(d3.select(this), expected_value_data['row_value_proportions'][i]);
			var prop_text = (100 * expected_value_data['row_value_proportions'][i]).toFixed(2) + '%';
			d3.select(this)
				.append('div')
				.attr('class', 'tile_label')
				.text(prop_text);
		});

		var value_utility_divs = d3.selectAll('.individual_utility_slot');
		value_utility_divs.each(function(d, i){
			fill_div_horizontally(d3.select(this), expected_value_data['row_expected_utilities'][i]/max_utility);
			d3.select(this)
				.append('div')
				.attr('class', 'tile_label')
				.text(expected_value_data['row_expected_utilities'][i].toExponential(3));
		});


	}


	// return results]
	expected_value_data['expected_utility_change'] = expected_utility_change;
	end_time = Date.now();
	// stored for download, esp. with range
	expected_value_data['metaparameters'] = {
		'ticket_price':unit_cost, 
		'quantity':quantity, 
		'pool_size':pool_size, 
		'net_worth':net_worth, 
		'total_tickets_sold':total_tickets_sold,
	}
	expected_value_data['labels'] = $('.prob_label > input').map(function(e){return $(this).val();});
	expected_value_data['runtime'] = end_time - start_time;

	master_results_list.push(expected_value_data);
	return expected_value_data;
}


function lrecursive_value_calculation(prob, net_value, remaining_tickets, remaining_prob,
	very_low_probs, low_probs, intermediate_probs, jackpot_probs,
	pool_size, 
	){
	// prob = cumulative product of probability
	// net_value = cumulative accumulated net value
	// remaining_tickets = # of tickets left
	// remaining_prob = amount of probability left given that certain tickets weren't found
	// this is used to calculate conditional probability, given that previous tickets are not possible
	// options for future 
	//console.log('remaining prob');
	//console.log(remaining_prob);
	var prob_payout_data = [];
	// terminate condition
	if (remaining_tickets == 0 | prob <= -24 | remaining_prob == 0){
		//console.log('first exit condition');
		return [{net:net_value, prob:prob}];
	}

	if (prob < -26 | remaining_prob < 0){
		console.log('danger!');
	}

	// probability got too low
	if (isNaN(prob)){
		console.log('NaN prob');
		console.log(remaining_tickets);
		console.log(remaining_prob);
		console.log(net_value);
		console.log([very_low_probs.length, low_probs.length, intermediate_probs.length, jackpot_probs.length]);
		return [];
	}

	// determine mode then perform calculations
	if (very_low_probs.length > 0){
		var total_very_low_probability = 0;
		var individual_total_very_low_probability = 0;
		for (var i = 0; i < very_low_probs.length; i++){
			var payout = very_low_probs[i]['payout']/pool_size;
			var probability = very_low_probs[i]['probability'] * remaining_tickets/remaining_prob;
			// remove all other "very_low" entries from consideration
			prob_payout_data.extend(
				lrecursive_value_calculation(prob +log(probability), net_value + payout, remaining_tickets-1,
					remaining_prob-very_low_probs[i]['probability']/remaining_prob,
					[], low_probs, intermediate_probs, jackpot_probs,
					pool_size
				)
			);
			total_very_low_probability+=probability;
			individual_total_very_low_probability+=very_low_probs[i]['probability']/remaining_prob;
		}
		// in case all of them whiff
		prob_payout_data.extend(
			lrecursive_value_calculation(prob +log(1-total_very_low_probability), net_value, remaining_tickets,
				remaining_prob-individual_total_very_low_probability,
				[], low_probs, intermediate_probs, jackpot_probs,
				pool_size
			)
		);
	}
	else if (low_probs.length > 0){
		var low_probs_copy = deep_copy(low_probs);

		// take first element and remove from list; calculate for both present and missing
		var prob_data = low_probs_copy.shift();
		var probability = prob_data['probability'] * remaining_tickets/remaining_prob;
		var payout = prob_data['payout']/pool_size;
		if (probability * prob > 0){
			// win
			prob_payout_data.extend(
				lrecursive_value_calculation(prob +log(probability), net_value + payout, remaining_tickets-1,
					remaining_prob - prob_data['probability']/remaining_prob,
					[], low_probs_copy, intermediate_probs, jackpot_probs,
					pool_size
				)
			);
		}
		// no win
		prob_payout_data.extend(
			lrecursive_value_calculation(prob +log(1-probability), net_value, remaining_tickets,
				remaining_prob - prob_data['probability']/remaining_prob,
				[], low_probs_copy, intermediate_probs, jackpot_probs,

			)
		);
	}
	else if (intermediate_probs.length > 0){
		//console.log('intermediate mode');
		var intermediate_probs_copy = deep_copy(intermediate_probs);
		var prob_data = intermediate_probs_copy.shift();
		// note that this allows multiple winnings
		// the likely values need to be decided via 
		// binomial calculations w/ 
		// p = probability; n = remaining_tickets
		var probability = prob_data['probability']/remaining_prob;
		var payout = prob_data['payout']/pool_size;

		var mean_count = remaining_tickets * probability;
		var sd_count = Math.sqrt(remaining_tickets * probability * (1-probability));

		// calculate bounds; extra offset of 1 added for rounding issues
		// calculate minimum count
		var min_count = Math.floor(Math.max(0, mean_count - significance_z*sd_count -1));

		// calculate maximum likely count
		var max_count = Math.floor(Math.min(remaining_tickets, mean_count + significance_z*sd_count + 1));
		// note that a lot of probability space can get cut out from this approximation
		// extra probability will be added to the endpoints based on the amount missing

		// in this scenario, probabilities are calculated as logarithms due to the simplification
		// from utilizing the log of binomial probabilities
		var sum_intermediate_probability = 0;
		var case_probabilities = [];
		for (var i=min_count; i <= max_count; i++){
			var case_probability = lcalculate_binomial_probability(
				remaining_tickets, i, probability 
			);
			case_probabilities.push(case_probability);
			sum_intermediate_probability+=Math.pow(10, case_probability);
		}
		//console.log(case_probabilities);
		// hackerman
		//console.log(sum_intermediate_probability);
		if (sum_intermediate_probability < 1){
			// may use this later on
			//console.log('fixing probs...');
			//console.log(sum_intermediate_probability);
			var leftover_prob = 1-sum_intermediate_probability;
			// var skewness = (1-2*probability)/Math.sqrt(remaining_tickets * probability*(1-probability));
			if (min_count > 0 & max_count < remaining_tickets){
				case_probabilities[0]['prob']=log(
					Math.pow(10, case_probabilities[0]['prob']) + leftover_prob/2
				);
				case_probabilities[case_probabilities.length-1]['prob']=log(
					Math.pow(10, case_probabilities[case_probabilities.length-1]['prob']) + leftover_prob/2
				);
			}
			else if (min_count == 0){
				case_probabilities[case_probabilities.length-1]['prob']=log(
					Math.pow(10, case_probabilities[case_probabilities.length-1]['prob']) + leftover_prob/2
				);
			}
			else{
				case_probabilities[0]['prob']=log(
					Math.pow(10, case_probabilities[0]['prob']) + leftover_prob
				);
			}
		}

		for (var i=0; i < case_probabilities.length; i++){

			var case_probability = case_probabilities[i];
			//binomial_coefficient * binomial_probability;
			//console.log([i, probability]);
			// no point in propagating zero probs
			if (prob + case_probability <= -25){
				continue;
			}
			if (isNaN(case_probability)){
				console.log([remaining_tickets, min_count+i, payout, probability]);
			}
			prob_payout_data.extend(
				lrecursive_value_calculation(prob + case_probability, net_value + payout*(min_count+i), 
					remaining_tickets-(min_count+i),
					remaining_prob - probability,
					[], [], intermediate_probs_copy, jackpot_probs,
					pool_size
				)
			);
		}

	}
	else if (jackpot_probs.length > 0){
		//very similar to very low probs
		var total_jackpot_probability = 0;
		for (var i=0; i < jackpot_probs.length; i++){
			var new_entry = {
				net:net_value + jackpot_probs[i]['payout']/pool_size,
				prob:prob + log(jackpot_probs[i]['probability']*remaining_tickets/remaining_prob)
			}
			prob_payout_data.push(
				new_entry
			);
			total_jackpot_probability+=jackpot_probs[i]['probability']*remaining_tickets;
			/*
			console.log([jackpot_probs[i]['payout']/pool_size,
			jackpot_probs[i]['probability'] * remaining_tickets/remaining_prob,
			jackpot_probs[i]['payout']/pool_size *
			jackpot_probs[i]['probability'] * remaining_tickets/remaining_prob,
			remaining_prob,
			prob
			]);
			*/


		}
		prob_payout_data.push(
		{
			net:net_value,
			prob:prob + log(1-total_jackpot_probability)
		});

	}
	// second terminate condition; should happen if no jackpot probs after intermediate probs finishes
	else{
		return [{net:net_value, prob:prob}]
	}

	//most calls end here
	return prob_payout_data;

}

/* extra math/utility functions*/
//next three functions aggregate over a list of dicts
function get_min(data, key){
	var min_val = data[0][key];
	for (var i=1; i < data.length; i++){
		min_val = Math.min(min_val, data[i][key]);
	}
	return min_val;
}

function get_max(data, key){
	var max_val = data[0][key];
	for (var i=1; i < data.length; i++){
		max_val = Math.max(min_val, data[i][key]);
	}
	return max_val;
}

function get_sum(data, key){
	var total = 0;
	for (var i=0; i < data.length; i++){
		total+=  data[i][key];
	}
	return total;
}

function log(x, log_exponent=10){
	return Math.log(x)/Math.log(log_exponent);
}

//simple implementation
function factorial(x){
	if (x == 0){
		return 1;
	}
	var result = 1;
	for (var i = 1; i <= x; i++){
		result *= i;
	}
	return result;
}

// log form
function lfactorial(x){
	if (x > 500){
		// n*log(n) - n is approximation
		var simplification = x * Math.log(x) - x;
		// convert to base 10
		return simplification/Math.log(10);
	}
	if (x == 0){
		return 0;
	}
	var result = 0;
	for (var i = 1; i <= x; i++){
		result+=log(i);
	}
	return result;
}

function choose(n, k){
	var result = 1;
	// simplify calculation complexity
	if (k > n/2){
		k = n - k;
	}

	for (var i = 0; i < k; i++){
		result*=(n-i)
	}
	result /= factorial(k);
	if (!isNaN(result)){
		return result;
	}
	else{
		// large-number approximation
		// n! ~ n^n/e^n * sqrt(2*pi*n)
		// it is assumed that k is large enough to cause problems
		/*
		n^n/(k^(k) * (n-k)^(n-k)) / sqrt(2*pi) * sqrt(n)/sqrt(k*(n-k))

		==>

		(n/k)^k * (n/(n-k)) ^ (n-k) * sqrt(n)/sqrt(2*pi*k*(n-k))

		*/

		return Math.pow(n/k, k) * Math.pow(n/(n-k), n-k) * Math.sqrt(n/(2*Math.PI*k*(n-k)));
	}
}

// log form
function lchoose(n, k){
	var result = 0;
	return lfactorial(n) - lfactorial(k) - lfactorial(n-k);
}

function calculate_binomial_probability(n, k, p){
	var return_val = choose(n, k) * Math.pow(p, k) * Math.pow(1-p, n-k);
	if (!isFinite(return_val) | isNaN(return_val)){
		//console.log('alt calc');
		// combine formula in choose() with probabilities
		return Math.pow(n/k * p, k) * Math.pow(n/(n-k) * (1-p), n-k) * Math.sqrt(n/(2*Math.PI*k*(n-k)));
	}
	return return_val
}

// log form
function lcalculate_binomial_probability(n, k, p){
	var lfactor = lchoose(n, k);
	return lfactor + k * log(p) + (n-k) * log(1-p);
}

function deep_copy(x){
	if (typeof x.constructor==Object)
		var newObject = $.extend(true, {}, x);
	else
		var newObject = $.map(x, function (obj) {
                      return $.extend(true, {}, obj);
                  });
	return newObject;
}

// https://stackoverflow.com/a/17368101
// fixes issue with call stack maximum size when using .push()
Array.prototype.extend = function (other_array) {
    /* You should include a test to check whether other_array really is an array */
    other_array.forEach(function(v) {this.push(v)}, this);
}

// https://web-design-weekly.com/snippets/scroll-to-position-with-jquery/
$.fn.scrollView = function () {
  return this.each(function () {
    $('html, body').animate({
      scrollTop: $(this).offset().top
    }, 1000);
  });
}

$.fn.redraw = function() {
    return this.hide(0, function() {
        $(this).show();
    });
};

// https://stackoverflow.com/a/16360660
function gradient_calc(c1, c2, ratio){
	/*
	c1 - color 1
	c2 - color 2
	ratio - percentage between c1 and c2
	*/
	var hex = function(x) {
	    x = x.toString(16);
	    return (x.length == 1) ? '0' + x : x;
	};

	var r = Math.ceil(parseInt(c1.substring(0,2), 16) * ratio + parseInt(c2.substring(0,2), 16) * (1-ratio));
	var g = Math.ceil(parseInt(c1.substring(2,4), 16) * ratio + parseInt(c2.substring(2,4), 16) * (1-ratio));
	var b = Math.ceil(parseInt(c1.substring(4,6), 16) * ratio + parseInt(c2.substring(4,6), 16) * (1-ratio));

	var middle = hex(r) + hex(g) + hex(b);
	return middle;
}

// d3-based functions

function fill_div_horizontally(
	element_or_id,
	percentage
){
	// element_id can be a d3 element or an element_id


	// select element and clear it
	//console.log(typeof element);
	if (typeof element_or_id=='string')
		var element = d3.select('#' + element_or_id);
	else
		var element = element_or_id
	element.html('');


	var element_width = element.node().getBoundingClientRect().width;
	//console.log(element_width);

	var element_height = 30;//element.node().getBoundingClientRect().height;
	//console.log(element_height);

	var width = Math.round(percentage * element_width);
	var color = '#' + gradient_calc('33DD33', 'EE1111',percentage);
	var containing_div = element.append('div')
		.attr('class','horizontal_fill_div');

	var svg = containing_div.append('svg')
		.attr('class','horizontal_fill_svg')
		.attr('width', width)
		.attr('height', element_height);

	var g = svg.append('g');

	var rect = g.append('rect')
		.attr('class', 'horizontal_rect')
		.attr('fill', color)
		.attr('x', 0)
		.attr('y', 0)
		.attr('height', element_height)
		.attr('width', width);


}

function plot_model_data(model_data){
	/*

	*/
	var range_params = model_data['range_params'];
	var interval_type = range_params['interval_type'];
	var values = range_params['values'];
	var varname = range_params['varname'];

	var results_list = model_data['results_list'];
	// each result has an expected_utility_change and individual_expected_value

	// we can also do a small plot of the individual_expected_value if the total_tickets_sold is 
	// changed *and* there's a jackpot involved (that can come later)

	// clear plotting area
	$('#plot_div').html('');

	var plot_div = d3.select('#plot_div');

	var margin = {top:48, right:52, bottom:60, left:60};
	var height = margin['top'] + margin['bottom'] + 45 * values.length + 20;
	var width = 640;

	//make new graph area
	var plot_div = d3.select('#plot_div');

	var tooltip_div = plot_div.append('div')
		.attr('class','tooltip')
		.style('opacity',1)
		.text('Hover over a bar and details will appear here.')
		.style('font-weight', 'bold')
		.style('font-size', '32px');
	
	

	var expected_utilities = results_list.map(function(e,i){return e['expected_utility_change']});
	var ymin = d3.min(expected_utilities);
	var ymax = d3.max(expected_utilities);
	ymax = d3.max([ymax, 0]);
	ymin = d3.min([ymin, 0]);
	var expected_utilities_color = expected_utilities.map(
		function(e,i) {return e <= 0 ? 'firebrick' : 'forestgreen';});

	var xmax = values[values.length-1];
	var xmin = values[0];

	// note that y refers to output, x refers to input, but dimensions will be flipped
	var xScale = d3.scaleLinear()
		.range([margin.left, width-margin.left-margin.right]);

	/*
	var yScale = d3.scaleBand()
		.rangeRound([0, height])
		.paddingInner(0.1);
	*/

	if (interval_type=='linear'){
		var yScale = d3.scaleLinear()
			.rangeRound([margin.top, height-margin.bottom-margin.top])
			.domain([xmin, xmax]);
	}
	else{
		console.log('scale type: ' + interval_type);
		var yScale = d3.scaleLog()
			.rangeRound([margin.top,  height-margin.bottom-margin.top])
			.domain([xmin, xmax]);
	}

	var bandwidth = 0.9*(height-margin.top-margin.bottom-10)/(values.length+2)

	xScale.domain([ymin, ymax]);
	yScale.domain([xmin, xmax]);

	var xAxis = d3.axisBottom()
		.scale(xScale);

	var new_plot = plot_div.append('svg')
		.attr('id','main_plot')
		.attr('class', 'main_plot_svg')
		.attr('height',(height) + 'px')
		.attr('width', width + 'px')
		.append('g')
		;//.attr('transform','translate(' + margin.left + ',' + margin.top + ')');

	new_plot.selectAll('.bar')
		.data(results_list)
		.enter()
		.append('rect')
			.attr('x', function(d, i) {return xScale(Math.min(0, d['expected_utility_change'])) ;})
			.attr('y', function(d, i){ return yScale(values[i]);})
			.attr('width', function(d, i) { return Math.abs(xScale(d['expected_utility_change']) - 
				xScale(0));})
			.attr('height', bandwidth)
			.attr('fill', function(d){
				if (d['expected_utility_change'] < 0)
					return 'firebrick';
				else
					return 'forestgreen';
			})
		.on('mouseover', function(d, i) {
			tooltip_div.transition()
			 .duration(200)
			 .style('opacity',1.0);
			tooltip_div.style('font-weight', 'normal')
		     .style('font-size', '16px');
			tooltip_div.html(
				make_tooltip_text(d, i, model_data, values)
			 )
			 .style('left', (d3.event.pageX) + 'px')
			 .style('top', (d3.event.pageY - 28) + 'px');

		})
		.on('mouseout', function(d) {
			/*
			tooltip_div.transition()
			 .duration(500)
			 .style('opacity',0);
			 */
		});

	var vAxis = new_plot.append('line')
		.attr('x1', xScale(0)-1)
		.attr('x2', xScale(0)-1)
		.attr('y1', margin.top)
		.attr('y2', yScale(xmax) + 45)
		.attr('stroke','black')
		.attr('stroke-width','2');

	var tAxis = d3.axisTop(xScale)
		.tickFormat(d => numberWithCommas(100 * (Math.pow(10, d)-1), 5) + '%').ticks(8);

	new_plot.append('g')
		.attr('class','x axis')
		.call(tAxis)
		.attr('transform','translate(0,' + margin.top + ')');

	var title = 'Expected utilities of purchasing tickets over varying ' + display_names[varname].toLowerCase()
	 .replace(/ ?\(.*$/g, '');

	var titleText = new_plot.append('text')
		.attr('x', margin.left)
		.attr('y', Math.round(margin.top/2))
		.attr('font-family','sans-serif')
		.attr('font-size','16px')
		.attr('font-weight','bolder')
		.html(title);

	var lowerText = new_plot.append('text')
		.attr('x', Math.round(width/2-margin.right - 80))
		.attr('y', height-margin.bottom+10)
		.attr('font-family','sans-serif')
		.attr('font-size','16px')
		.html('Expected proportion of wealth gained or lost');

	// let's make some axis text
	var formatter = metavar_formatters[varname];

	var axisText = new_plot.selectAll('.bar_labels')
		.data(results_list)
		.enter()
		.append('text')
		.attr('y', function(d, i) {return yScale(values[i]) + 
			Math.round(0.6*bandwidth+2)})
		.attr('x', function(d, i) {
			if (Math.pow(10, d['expected_utility_change']) -1 > 0){
				return xScale(0) - 4;
			}
			return xScale(0)+2;
		})
		.attr('text-anchor', function(d){
			if (Math.pow(10, d['expected_utility_change']) -1 > 0){
				return 'end';
			}
			else{
				return 'start';
			}
		})
		.html(function(d){
			return formatter(d['metaparameters'][varname]);
		})
		.attr('font-family','sans-serif')
		.attr('font-size','12px');





	/*

	new_plot.append('g')
		.attr('class', 'x axis')
		.attr('transform','translate(0,' + (height-margin.top) + ')')
		.call(xAxis);

	var tickNeg = new_plot.append('g')
		.attr('class','y axis')
		.attr('transform','translate(' + xScale(0) + ',0)')
		.call(d3.axisLeft(yScale))
		.selectAll('.tick')
		.filter(function(d, i){ return results_list[i]['expected_utility_change'] < 0;});

	tickNeg.select('line')
		.attr('x2', 6);

	tickNeg.select('text')
		.attr('x', 9)
		.style('text-anchor','start');
	*/



}

metavar_formatters = {
	pool_size: function(x){
		return ' ' + numberWithCommas(x);
	},
	net_worth: function(x){
		return ' $' + numberWithCommas(x, 2);
	},
	quantity: function(x){
		return ' ' + numberWithCommas(x);

	},
	total_tickets_sold: function(x){
		return ' ' + numberWithCommas(x);
	},
	ticket_price: function(x){
		return ' $' + numberWithCommas(x, 2);
	}


}

function make_tooltip_text(d, i, model_data, values){
	var eu_change = d['expected_utility_change'];
	var eu_change_pct = Math.pow(10, eu_change)-1;
	var abs_eu_change = Math.abs(eu_change_pct);
	var metaparameters = d['metaparameters'];

	var quantity = metaparameters['quantity'];
	var pool_size = metaparameters['pool_size'];
	var ticket_price = metaparameters['ticket_price'];
	var net_worth = metaparameters['net_worth'];
	var total_tickets_sold = metaparameters['total_tickets_sold'];

	var net_worth_change = eu_change_pct * net_worth;
	var abs_net_worth_change = Math.abs(net_worth_change);

	var abs_net_worth_change_order_of_magnitude = Math.max(2, -Math.floor(log(abs_eu_change)));

	var net_worth_change_formatted = '$' + numberWithCommas(net_worth_change, 4)

	var val = values[i];

	var return_text = '';

	var quantity_text = quantity > 1 ? ' these <b>' + quantity + '</b> tickets' : ' this <b>one</b> ticket';
	var pool_size_text = pool_size > 1 ? ' <b>in a pool with ' + pool_size + ' others</b>' : '';
	var ticket_price_text = (quantity * pool_size > 1 ? ' <b>each ' : ' <b>') + 'purchased for a price of $' + 
	ticket_price.toFixed(2) + '</b>';
	var net_worth_text = ' for an individual with a <b>net worth of $' + numberWithCommas(net_worth, 2) + '</b>';
	var total_tickets_sold_text = ' and a total of <b>' + numberWithCommas(total_tickets_sold) + ' tickets sold to others</b>' +
	 (pool_size > 1 ? ' outside the pool' : '') ;

	

	var change_text = 'The expected utility of' + quantity_text + pool_size_text + ticket_price_text + 
	 net_worth_text + total_tickets_sold_text;

	return_text += change_text;

	if (eu_change_pct > 0){
		return_text += ' is an <b style="color:forestgreen">increase</b> of <b>' + 
		 net_worth_change_formatted + '</b>';

		var corresponding_text = 
		 'This corresponds to an <b style="color:forestgreen">increase</b> in <b>' + 
		 numberWithCommas(100*abs_eu_change, abs_net_worth_change_order_of_magnitude) + 
		 '%</b> of one\'s net worth.';
	}
	else{
		return_text += ' is a <b style="color:firebrick">decrease</b> of <b>' + 
		 net_worth_change_formatted + '</b>';

		var corresponding_text = 
		 'This corresponds to a <b style="color:firebrick">decrease</b> in <b>' + 
		 numberWithCommas(100*abs_eu_change, abs_net_worth_change_order_of_magnitude) + 
		 '%</b> of one\'s net worth.';

	}
	return_text += '</br></br>' + corresponding_text;
	return return_text;
}

// https://stackoverflow.com/a/2901298
function numberWithCommas(x, round=-1) {
	if (round > -1){
		var parts = x.toFixed(round).split('.');
	}
	else{
		var parts = x.toString().split(".");
	}
    parts[0] = parts[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    return parts.join(".");
}

// now replaced with log version

function recursive_value_calculation(prob, net_value, remaining_tickets, remaining_prob,
	very_low_probs, low_probs, intermediate_probs, jackpot_probs,
	pool_size, 
	){
	// prob = cumulative product of probability
	// net_value = cumulative accumulated net value
	// remaining_tickets = # of tickets left
	// remaining_prob = amount of probability left given that certain tickets weren't found
	// this is used to calculate conditional probability, given that previous tickets are not possible
	// options for future 
	//console.log('remaining prob');
	//console.log(remaining_prob);
	var prob_payout_data = [];
	// terminate condition
	if (remaining_tickets == 0 | prob == 0 | remaining_prob == 0){
		console.log('first exit condition');
		return [{net:net_value, prob:prob}];
	}

	if (prob < 0 | remaining_prob < 0){
		console.log('danger!');
	}

	// probability got too low
	if (isNaN(prob)){
		console.log('NaN prob');
		console.log(remaining_tickets);
		console.log(remaining_prob);
		console.log(net_value);
		console.log([very_low_probs.length, low_probs.length, intermediate_probs.length, jackpot_probs.length]);
		return [];
	}

	// determine mode then perform calculations
	if (very_low_probs.length > 0){
		var total_very_low_probability = 0;
		var individual_total_very_low_probability = 0;
		for (var i = 0; i < very_low_probs.length; i++){
			var payout = very_low_probs[i]['payout']/pool_size;
			var probability = very_low_probs[i]['probability'] * remaining_tickets/remaining_prob;
			// remove all other "very_low" entries from consideration
			prob_payout_data.extend(
				recursive_value_calculation(prob*probability, net_value + payout, remaining_tickets-1,
					remaining_prob-very_low_probs[i]['probability']/remaining_prob,
					[], low_probs, intermediate_probs, jackpot_probs,
					pool_size
				)
			);
			total_very_low_probability+=probability;
			individual_total_very_low_probability+=very_low_probs[i]['probability']/remaining_prob;
		}
		// in case all of them whiff
		prob_payout_data.extend(
			recursive_value_calculation(prob*(1-total_very_low_probability), net_value, remaining_tickets,
				remaining_prob-individual_total_very_low_probability,
				[], low_probs, intermediate_probs, jackpot_probs,
				pool_size
			)
		);
	}
	else if (low_probs.length > 0){
		var low_probs_copy = deep_copy(low_probs);

		// take first element and remove from list; calculate for both present and missing
		var prob_data = low_probs_copy.shift();
		var probability = prob_data['probability'] * remaining_tickets/remaining_prob;
		var payout = prob_data['payout']/pool_size;
		if (probability * prob > 0){
			// win
			prob_payout_data.extend(
				recursive_value_calculation(prob*probability, net_value + payout, remaining_tickets-1,
					remaining_prob - prob_data['probability']/remaining_prob,
					[], low_probs_copy, intermediate_probs, jackpot_probs,
					pool_size
				)
			);
		}
		// no win
		prob_payout_data.extend(
			recursive_value_calculation(prob*(1-probability), net_value, remaining_tickets,
				remaining_prob - prob_data['probability']/remaining_prob,
				[], low_probs_copy, intermediate_probs, jackpot_probs,

			)
		);
	}
	else if (intermediate_probs.length > 0){
		//console.log('intermediate mode');
		var intermediate_probs_copy = deep_copy(intermediate_probs);
		var prob_data = intermediate_probs_copy.shift();
		// note that this allows multiple winnings
		// the likely values need to be decided via 
		// binomial calculations w/ 
		// p = probability; n = remaining_tickets
		var probability = prob_data['probability']/remaining_prob;
		var payout = prob_data['payout']/pool_size;

		var mean_count = remaining_tickets * probability;
		var sd_count = Math.sqrt(remaining_tickets * probability * (1-probability));

		// calculate bounds; extra offset of 1 added for rounding issues
		// calculate minimum count
		var min_count = Math.floor(Math.max(0, mean_count - significance_z*sd_count -1));

		// calculate maximum likely count
		var max_count = Math.floor(Math.min(remaining_tickets, mean_count + significance_z*sd_count + 1));
		// note that a lot of probability space can get cut out from this approximation
		// extra probability will be added to the endpoints based on the amount missing

		var sum_intermediate_probability = 0;
		var case_probabilities = [];
		for (var i=min_count; i <= max_count; i++){
			var case_probability = calculate_binomial_probability(
				remaining_tickets, i, probability 
			);
			case_probabilities.push(case_probability);
			sum_intermediate_probability+=case_probability;
		}
		//console.log(case_probabilities);
		// hackerman
		if (sum_intermediate_probability < 1){
			// may use this later on
			//console.log('fixing probs...');
			//console.log(sum_intermediate_probability);
			var leftover_prob = 1-sum_intermediate_probability;
			var skewness = (1-2*probability)/Math.sqrt(remaining_tickets * probability*(1-probability));
			if (min_count > 0 & max_count < remaining_tickets){
				case_probabilities[0]['prob']+=leftover_prob/2;
				case_probabilities[case_probabilities.length-1]+=leftover_prob/2
			}
			else if (min_count == 0){
				case_probabilities[case_probabilities.length-1]+=leftover_prob
			}
			else{
				case_probabilities[0]['prob']+=leftover_prob;
			}
		}

		for (var i=0; i < case_probabilities.length; i++){

			var case_probability = case_probabilities[i];
			//binomial_coefficient * binomial_probability;
			//console.log([i, probability]);
			// no point in propagating zero probs
			if (prob * case_probability == 0){
				continue;
			}
			if (isNaN(case_probability)){
				console.log([remaining_tickets, min_count+i, payout, probability]);
			}
			prob_payout_data.extend(
				recursive_value_calculation(prob*case_probability, net_value + payout*(min_count+i), 
					remaining_tickets-(min_count+i),
					remaining_prob - probability,
					[], [], intermediate_probs_copy, jackpot_probs,
					pool_size
				)
			);
		}

	}
	else if (jackpot_probs.length > 0){
		//very similar to very low probs
		var total_jackpot_probability = 0;
		for (var i=0; i < jackpot_probs.length; i++){
			var new_entry = {
				net:net_value + jackpot_probs[i]['payout']/pool_size,
				prob:prob * jackpot_probs[i]['probability']*remaining_tickets/remaining_prob
			}
			prob_payout_data.push(
				new_entry
			);
			total_jackpot_probability+=jackpot_probs[i]['probability']*remaining_tickets;
			/*
			console.log([jackpot_probs[i]['payout']/pool_size,
			jackpot_probs[i]['probability'] * remaining_tickets/remaining_prob,
			jackpot_probs[i]['payout']/pool_size *
			jackpot_probs[i]['probability'] * remaining_tickets/remaining_prob,
			remaining_prob,
			prob
			]);
			*/


		}
		prob_payout_data.push(
		{
			net:net_value,
			prob:prob * (1-total_jackpot_probability)
		});

	}
	// second terminate condition; should happen if no jackpot probs after intermediate probs finishes
	else{
		return [{net:net_value, prob:prob}]
	}

	//most calls end here
	return prob_payout_data;

}


//DEPRECATED CODE CHUNKS
//very_low
	/*
	var very_low_zero_payout_probability = 1;
	for (var i = 0; i < grouped_prob_data['very_low'].length; i++){
		very_low_zero_payout_probability -= grouped_prob_data['very_low'][i]['probability'];
	}

	grouped_prob_data['very_low'].push(
	{
		'payout':0,
		'expected_count': total_tickets * very_low_zero_payout_probability,
		'expected_count_sd': Math.sqrt(total_tickets * very_low_zero_payout_probability * (1-very_low_zero_payout_probability));
		'probability':very_low_zero_payout_probability
	});

	
	//low
	var low_zero_payout_probability = 1;
	for (var i = 0; i < grouped_prob_data['low'].length; i++){
		low_zero_payout_probability -= grouped_prob_data['low'][i]['probability'];
	}

	
	grouped_prob_data['low'].push(
	{
		'payout':0,
		'expected_count': total_tickets * low_zero_payout_probability,
		'expected_count_sd': Math.sqrt(total_tickets * low_zero_payout_probability * (1-low_zero_payout_probability));
		'probability':low_zero_payout_probability
	});

	//intermediate
	var intermediate_zero_payout_probability = 1;
	for (var i = 0; i < grouped_prob_data['intermediate'].length; i++){
		intermediate_zero_payout_probability -= grouped_prob_data['low'][i]['probability'];
	}

	grouped_prob_data['intermediate'].push(
	{
		'payout':0,
		'expected_count': total_tickets * intermediate_zero_payout_probability,
		'expected_count_sd': Math.sqrt(total_tickets * intermediate_zero_payout_probability * (1-intermediate_zero_payout_probability));
		'probability':intermediate_zero_payout_probability
	});
	

	//jackpot
	if (grouped_prob_data['jackpot'].length == 0){
		grouped_prob_data['jackpot'].push({
			payout:0,
			expected_count:total_tickets,
			expected_count_sd:0,
			probability:1
		});
	}
	else{
		var jprob=grouped_prob_data['jackpot_probability'];
		grouped_prob_data['jackpot'].push({
			payout:0,
			expected_count:jprob * total_tickets,
			probability:1-jprob,
			expected_count_sd: Math.sqrt(jprob*(1-jprob)*total_tickets)
		});
	}
	*/

// old plot code

/*


	// redo
	if (interval_type=='linear'){
		var x1 = d3.scaleLinear()
			.rangeRound([0, width-margin['left'] - margin['right']])
			.padding(0.2)
			.domain([xmin, xmax]);
	}
	else{
		var x1 = d3.scaleLog()
			.rangeRound([0, width-margin['left'] - margin['right']])
			.domain([xmin, xmax]);
	}

	

	var y1 = d3.scaleLinear()
		.domain([ymax, ymin])
		.range([0, 480 - margin['top'] - margin['bottom']]);

	console.log([ymin, ymax]);

	// enter data
	var bar = new_plot.selectAll('g')
		.data(results_list)
		.enter().append('rect')
		.attr('class','eu_bar')
		.attr('width', (x1(xmax)-x1(xmin))/(values.length+3))
		.attr('fill',function(d){
			if (d['expected_utility_change'] < 0)
				return 'firebrick';
			else
				return 'forestgreen';
		})
		.attr('height', function(d) {
			return Math.abs(y1(d['expected_utility_change'])-y1(0));
			/*
			if (d['expected_utility_change'] < 0){
				return (y1(0) - y1(d['expected_utility_change']));
			}
			else{
				return y1(d['expected_utility_change']);
			}
			//
		})
		.attr('x', function(d,  i) {console.log(values[i]);return x1(values[i]);})
		.attr('y', function(d) {
			console.log(d['expected_utility_change']);
			if (d['expected_utility_change'] < 0){
				console.log(y1(d['expected_utility_change']));
				return y1(0);
			}
			else{
				return y1(0)-y1(ymax-d['expected_utility_change']);
			}
		});
		console.log(y1(0));
		console.log(y1(d3.min(expected_utilities)));
	new_plot.append('g')
		//.attr('transform','translate(0,' + y1(0) + ')')
		.call(d3.axisBottom(x1));

	new_plot.append('g')
		//.attr('transform','translate(0,' + (640-margin['left']-margin['right']) + ')')
		.call(d3.axisLeft(y1).ticks(10, '.0%'));

	// try again with vertical graph and better knowledge

	*/