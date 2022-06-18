// The module 'vscode' contains the VS Code extensibility API
// Import the module and reference it with the alias vscode in your code below
import * as vscode from 'vscode';

interface IProperty {
	typeName: string;
	propertyName: string;
}

function stringToPropertyDeclarations(str: string) : Array<IProperty>
{
	str = str.replace(/\/\/.*\n/g, "\n");
	str = str.replace(/\/\*.*\*\//g, "");
	return str.split(/\s*;\s*/).map(line => line.trim()).filter(line => line.length > 0).map(line => {
		const matches = line.match(/^\s*(.+)\s+([a-zA-Z0-9_]+)\s*;*\s*$/);
		if(!matches)
		{
			throw new Error(`Select one or more property declarations of the format 'int m_Number'\nFailure: ${line}`);
		}
		const typeName = matches[1];
		const propertyName = matches[2];
		return { typeName: typeName, propertyName: propertyName };
	});
}

function createGetterSetter(propertyDeclarations: Array<IProperty>)
{
	return propertyDeclarations.map(prop => {
		let setterName, getterName;
		const matches = prop.propertyName.match(/^m_(.+)$/);
		if(matches)
		{
			getterName = matches[1].charAt(0).toUpperCase() + matches[1].slice(1);
			setterName = "Set" + getterName;
		}
		else
		{
			const w = prop.propertyName.charAt(0).toUpperCase() + prop.propertyName.slice(1);
			getterName = "Get" + w;
			setterName = "Set" + w;
		}
		const parameterName = propertyName2Parameter(prop.propertyName);
		return `const ${prop.typeName}& ${getterName}() const { return ${prop.propertyName}; }
void ${setterName}(const ${prop.typeName}& ${parameterName}) { ${prop.propertyName} = ${parameterName}; }
void ${setterName}(${prop.typeName}&& ${parameterName}) { ${prop.propertyName} = std::move(${parameterName}); }
`;
	}).join("");
}

function createPropertyList(propertyDeclarations: Array<IProperty>)
{
	return propertyDeclarations.map( prop => prop.propertyName).join(", ")+"\n";
}

function propertyName2Parameter(propertyName: string)
{
	const matches = propertyName.match(/^m_(.+)$/);
	if(matches)
	{
		return matches[1].charAt(0).toLowerCase() + matches[1].slice(1);
	}
	else
	{
		return "_"+propertyName.charAt(0).toLowerCase() + propertyName.slice(1);
	}
}

function createConstructor(propertyDeclarations: Array<IProperty>)
{
	const parameterNames = propertyDeclarations.map(prop => prop.propertyName).map(propertyName2Parameter);
	const constructorParams = propertyDeclarations.map( (prop, index) => {
		return `const ${prop.typeName}& ${parameterNames[index]}`;
	}).join(", ");
	const initializers = propertyDeclarations.map( (prop, index) => {
		return `${prop.propertyName}(${parameterNames[index]})`;
	}).join(", ");
	return `CONSTRUCTORNAME(${constructorParams}) : ${initializers} {}\n`;
}

function applyToSelectedPropertiesInEditor(func: (props: Array<IProperty>) => string)
{
	try
	{
		const editor = vscode.window.activeTextEditor;
		if(!editor)
		{
			throw new Error("No text editor active");
		}
		const selection = editor.selection;
		if(selection.isEmpty)
		{
			throw new Error("Select one or more property declarations");
		}
		const text = editor.document.getText(selection);
		const props = stringToPropertyDeclarations(text);
		if(props.length === 0)
		{
			throw new Error("Select one or more property declarations");
		}
		const result = func(props);

		editor.edit((active) => {
			const pos = editor.selection.start;
			active.insert(pos, result);
		});		
	}
	catch(e)
	{
		if(e instanceof Error)
		{
			vscode.window.showErrorMessage(e.message);
		}
		else
		{
			vscode.window.showErrorMessage(""+e);
		}
	}
}

export function activate(context: vscode.ExtensionContext) {
	console.log("Joost's cpp utilities extension is now active!");

	context.subscriptions.push(vscode.commands.registerCommand('jcpp.encapsulate', () => {
		applyToSelectedPropertiesInEditor(createGetterSetter);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('jcpp.createConstructor', () => {
		applyToSelectedPropertiesInEditor(createConstructor);
	}));

	context.subscriptions.push(vscode.commands.registerCommand('jcpp.createPropertyList', () => {
		applyToSelectedPropertiesInEditor(createPropertyList);
	}));
}

// this method is called when your extension is deactivated
export function deactivate() {}
