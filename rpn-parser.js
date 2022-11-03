class Num {
	constructor(val, unc=0) {
		this.val = val;
		this.unc = unc;
	}

	setUnc(unc) {
		this.unc = unc.val;
		return this;
	}

	add (other) {
		return new Num(this.val + other.val, Math.sqrt(Math.pow(this.unc, 2) + Math.pow(other.unc, 2)))
	}

	sub (other) {
		return new Num(this.val - other.val, Math.sqrt(Math.pow(this.unc, 2) + Math.pow(other.unc, 2)))
	}

	mul (other) {
		return new Num(this.val * other.val, this.val * other.val * Math.sqrt(Math.pow(this.unc / this.val, 2) + Math.pow(other.unc / other.val, 2)))
	}

	div (other) {
		return new Num(this.val / other.val, this.val / other.val * Math.sqrt(Math.pow(this.unc / this.val, 2) + Math.pow(other.unc / other.val, 2)))
	}

	pow = x => new Num(Math.pow(this.val, x.val));
}

function parse(inp){
	var outQueue=[];
	var opStack=[];

	Array.prototype.peek = function() {
		return this.slice(-1)[0];
	};

	var assoc = {
		"^" : "right",
		"*" : "left",
		"/" : "left",
		"+" : "left",
		"-" : "left"
	};

	var prec = {
		"#" : 5,
		"^" : 4,
		"*" : 3,
		"/" : 3,
		"+" : 2,
		"-" : 2
	};

	Token.prototype.precedence = function() {
		return prec[this.value];
	};
	
	Token.prototype.associativity = function() {
		return assoc[this.value];
	};

	//tokenize
	var tokens=tokenize(inp);

	tokens.forEach(function(v) {
		//If the token is a number, then push it to the output queue
		if(v.type === "Literal" || v.type === "Variable" ) {
			outQueue.push(v);
		} 
		//If the token is a function token, then push it onto the stack.
		else if(v.type === "Function") {
			opStack.push(v);
		} //If the token is a function argument separator 
		else if(v.type === "Function Argument Separator") {
			//Until the token at the top of the stack is a left parenthesis
			//pop operators off the stack onto the output queue.
			while(opStack.peek()
				&& opStack.peek().type !== "Left Parenthesis") {
				outQueue.push(opStack.pop());
		}
			/*if(opStack.length == 0){
				console.log("Mismatched parentheses");
				return;
			}*/
		} 
		//If the token is an operator, o1, then:
		else if(v.type == "Operator") {
			  //while there is an operator token o2, at the top of the operator stack and either
			  while (opStack.peek() && (opStack.peek().type === "Operator") 
				//o1 is left-associative and its precedence is less than or equal to that of o2, or
				&& ((v.associativity() === "left" && v.precedence() <= opStack.peek().precedence())
					//o1 is right associative, and has precedence less than that of o2,
					|| (v.associativity() === "right" && v.precedence() < opStack.peek().precedence()))) {
			  	outQueue.push(opStack.pop());
			}
			//at the end of iteration push o1 onto the operator stack
			opStack.push(v);
		} 
		
		//If the token is a left parenthesis (i.e. "("), then push it onto the stack.
		else if(v.type === "Left Parenthesis") {
			opStack.push(v);
		}
		//If the token is a right parenthesis (i.e. ")"):
		else if(v.type === "Right Parenthesis") {
			//Until the token at the top of the stack is a left parenthesis, pop operators off the stack onto the output queue.
			while(opStack.peek() 
				&& opStack.peek().type !== "Left Parenthesis") {
				outQueue.push(opStack.pop());
		}
			/*if(opStack.length == 0){
				console.log("Unmatched parentheses");
				return;
			}*/
			//Pop the left parenthesis from the stack, but not onto the output queue.
			opStack.pop();

			//If the token at the top of the stack is a function token, pop it onto the output queue.
			if(opStack.peek() && opStack.peek().type === "Function") {
				outQueue.push(opStack.pop());
			}
		}
	});

	return outQueue.concat(opStack.reverse());
}

function polishToString(rpn) {
	return rpn.map(token => token.value).join(" ");
}

let operators = {
	"+": { arity: 2, func: (a, b) => a.add(b) },
	"-": { arity: 2, func: (a, b) => a.sub(b) },
	"*": { arity: 2, func: (a, b) => a.mul(b) },
	"/": { arity: 2, func: (a, b) => a.div(b) },
	"^": { arity: 2, func: (a, b) => a.pow(b) },
	"#": { arity: 2, func: (a, b) => a.setUnc(b) }
}

let functions = {
	"sin": { arity: 1, func: x => new Num(Math.sin(x.val)) },
	"cos": { arity: 1, func: x => new Num(Math.cos(x.val)) }
}

function evaluatePolish(rpn, vars, uncs) {
	let stack = [];

	for (let token of rpn) {
		switch (token.type) {
			case "Literal":
				stack.push(new Num(parseFloat(token.value)));
				break;
			case "Variable":
				if (!(token.value in vars)) {
					console.log("error: invalid variable name");
					return NaN;
				}

				let val = vars[token.value] || 0;
				let unc = uncs[token.value] || 0;

				stack.push(new Num(val, unc));
				break;
			case "Operator":
				if (token.value in operators) {
					if (stack.length >= operators[token.value].arity) {
						switch(operators[token.value].arity) {
							case 1:
								let a1 = stack.pop();
								stack.push(operators[token.value].func(a1))
								break;
							case 2:
								let b2 = stack.pop();
								let a2 = stack.pop();
								stack.push(operators[token.value].func(a2, b2))
								break;
							case 3:
								let c3 = stack.pop()
								let b3 = stack.pop();
								let a3 = stack.pop();
								stack.push(operators[token.value].func(a3, b3, c3))
								break;
							default:
								console.log("error: invalid operator arity")
								return NaN;
								break;
						}
					}
				} else {
					console.log("error: operator does not exist")
					return NaN;
				}
				break;
			case "Function":
				if (token.value in functions) {
					if (stack.length >= functions[token.value].arity) {
						switch(functions[token.value].arity) {
							case 1:
								let a1 = stack.pop();
								stack.push(functions[token.value].func(a1));
								break;
							case 2:
								let b2 = stack.pop();
								let a2 = stack.pop();
								stack.push(functions[token.value].func(a2, b2));
								break;
							case 3:
								let c3 = stack.pop();
								let b3 = stack.pop();
								let a3 = stack.pop();
								stack.push(functions[token.value].func(a3, b3, c3));
								break;
							default:
								console.log("error: invalid function arity");
								return NaN;
								break;
						}
					}
				} else {
					console.log("error: function does not exist");
					return NaN;
				}
				break;
			default:
				console.log("error: invalid token type: " + token.type);
				return NaN;
				break;
		}
	}

	if (stack.length === 0) {
		return new Num(0);
	} else if (stack.length > 1) {
		console.log("error: stack length not one; stack: " + stack);
		return NaN;
	} else {
		return stack[0];
	}
}