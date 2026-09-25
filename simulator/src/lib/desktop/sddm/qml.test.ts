import { describe, it, expect } from 'vitest';
import { parseQml, resolveColor, unquote, QML_INVALID_COLOR } from './qml';
import shipped from '../../../../../sddm/indigo-glass/Main.qml?raw';
import breezeMain from '../../../../fixtures/stock/sddm/Main.qml?raw';
import breezeLogin from '../../../../fixtures/stock/sddm/Login.qml?raw';

const SRC = `import QtQuick 2.15
Rectangle {
    id: root
    color: "#07080A" // base
    property string accent: "#A6C9A6"
    property string text: "#F8F8F8"
    Item {
        anchors { left: parent.left; right: parent.right }
        width: 360
        Rectangle { width: 10; height: 10; color: accent }
        Rectangle {
            id: box
            color: Qt.rgba(0.12, 0.13, 0.16, 1.0)
            border.color: box.activeFocus
                ? accent : "#5E5E60"
        }
        Text { text: "Hi"; color: text }
        Text { text: "Ok"; color: root.text }
    }
    Button {
        id: go
        background: Rectangle { color: go.pressed ? "#C0E3C0" : accent }
        Behavior on opacity { NumberAnimation { duration: 100 } }
    }
    ListView { actions: [ Item { objectName: "a" }, Item { objectName: "b" } ] }
    Connections { function onLoginFailed() { go.text = "" } }
    Keys.onPressed: event => {
        event.accepted = false
    }
}`;

describe('parseQml', () => {
  const doc = parseQml(SRC);
  it('names nodes by id, path and property', () => {
    expect(doc.root.id).toBe('root');
    expect(doc.node('root>Item')?.props.get('width')).toBe('360');
    expect(doc.node('root>Item>Rectangle')?.props.get('color')).toBe('accent');
    expect(doc.node('box')?.props.get('border.color')).toBe('box.activeFocus\n                ? accent : "#5E5E60"');
    expect(doc.node('go.background')?.type).toBe('Rectangle');
    expect(doc.node('go>Behavior on opacity')).toBeTruthy();
    expect(doc.node('root>ListView.actions[1]')?.props.get('objectName')).toBe('"b"');
  });
  it('keeps grouped properties, functions and handler blocks', () => {
    expect(doc.peek('root>Item', 'anchors.right')).toBe('parent.right');
    expect(doc.peek('root>Connections', 'function onLoginFailed')).toContain('go.text = ""');
    expect(doc.peek('root', 'Keys.onPressed')).toContain('event.accepted = false');
    expect(doc.peek('root', 'color')).toBe('"#07080A"');
  });
  it('tracks reads for coverage, peek does not', () => {
    doc.peek('root', 'accent');
    expect(doc.used().has('root/accent')).toBe(false);
    doc.get('root', 'accent');
    expect(doc.used().has('root/accent')).toBe(true);
  });
});

describe('resolveColor', () => {
  const doc = parseQml(SRC);
  const n = (k: string) => doc.node(k)!;
  it('resolves literals, root properties, Qt.rgba and ternaries', () => {
    expect(resolveColor(doc, n('root>Item>Rectangle'), 'accent').value).toBe('#A6C9A6');
    expect(resolveColor(doc, n('box'), n('box').props.get('color')).value).toBe('#1F2129');
    const b = resolveColor(doc, n('box'), n('box').props.get('border.color'));
    expect(b).toMatchObject({ value: '#5E5E60', state: '#A6C9A6' });
    expect(resolveColor(doc, n('root'), '"#80000000"').value).toBe('#00000080');
    expect(unquote('"Sign in"')).toBe('Sign in');
  });
  it('applies QML scoping: an unqualified name hits the object own property first', () => {
    const shadow = resolveColor(doc, n('root>Item>Text[0]'), 'text');
    expect(shadow.value).toBe(QML_INVALID_COLOR);
    expect(shadow.shadowed).toContain('own text');
    expect(resolveColor(doc, n('root>Item>Text[1]'), 'root.text').value).toBe('#F8F8F8');
  });
});

describe('real files', () => {
  it('parses the shipped Main.qml', () => {
    const d = parseQml(shipped);
    expect(d.node('panel')).toBeTruthy();
    expect(d.node('passwordInput.background')?.type).toBe('Rectangle');
    expect(d.peek('root>Connections', 'function onLoginFailed')).toContain('passwordInput.text = ""');
  });
  it('parses upstream Breeze Main.qml and Login.qml', () => {
    const d = parseQml(breezeMain);
    const actions = d.nodes.filter((x) => x.parent?.id === 'userListComponent' && x.via?.startsWith('actionItems['));
    expect(actions.map((a) => unquote(a.props.get('text')?.match(/"([^"]+)"\)$/)?.[0].slice(0, -1)))).toHaveLength(5);
    expect(d.node('footer')?.children.map((c) => c.type)).toEqual(expect.arrayContaining(['KeyboardButton', 'SessionButton', 'Battery']));
    const l = parseQml(breezeLogin);
    expect(l.node('passwordBox>Connections')?.props.get('function onLoginFailed')).toContain('selectAll');
  });
});
