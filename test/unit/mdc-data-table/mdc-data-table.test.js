/**
 * @license
 * Copyright 2019 Google Inc.
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be included in
 * all copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN
 * THE SOFTWARE.
 */

import {assert} from 'chai';
import {html, render} from 'lit-html';
import {classMap} from 'lit-html/directives/class-map.js';
import {initTemplatePolyfill} from 'lit-html/polyfills/template_polyfill';
import td from 'testdouble';
import {
  strings,
  cssClasses,
  events,
} from '../../../packages/mdc-data-table/constants';
import {
  MDCDataTable,
  MDCDataTableFoundation,
} from '../../../packages/mdc-data-table/index';

initTemplatePolyfill();

const mdcCheckboxTemplate = (props) => {
  return html`<div class="mdc-checkbox ${props.classNames}">
  <input type="checkbox" class="mdc-checkbox__native-control" ?checked="${props.isChecked}"></input>
  <div class="mdc-checkbox__background">
    <svg class="mdc-checkbox__checkmark" viewbox="0 0 24 24">
      <path class="mdc-checkbox__checkmark-path" fill="none" d="M1.73,12.91 8.1,19.28 22.79,4.59"></path>
    </svg>
    <div class="mdc-checkbox__mixedmark"></div>
  </div>
</div>`;
};

const mdcDataTableHeaderCellTemplate = (props) => {
  return html`
    <th class="mdc-data-table__header-cell" role="columnheader" scope="col">
      ${props.content}
    </th>
  `;
};

const mdcDataTableCellTemplate = (props) => {
  const classes = {
    [cssClasses.CELL_NUMERIC]: props.isNumeric,
  };
  return html`
    <td class="${classMap(classes)}">${props.content}</td>
  `;
};

const mdcDataTableRowTemplate = (props) => {
  const classes = {
    [cssClasses.ROW]: true,
    [cssClasses.ROW_SELECTED]: props.isSelected,
  };
  const ariaSelectedValue = props.isSelected ? 'true' : 'false';
  const rowCheckbox = mdcDataTableCellTemplate({
    content: mdcCheckboxTemplate({
      classNames: cssClasses.ROW_CHECKBOX,
      isChecked: props.isSelected,
    }),
  });

  return html`
    <tr
      data-row-id="${props.rowId}"
      class="${classMap(classes)}"
      aria-selected="${ariaSelectedValue}"
    >
      ${rowCheckbox} ${props.content}
    </tr>
  `;
};

const mdcDataTableData = {
  headers: ['Dessert', 'Calories', 'Fat', 'Carbs', 'Protein (g)'],
  rows: [
    ['Frozen yogurt', 159, 6.0, 24, 4.0],
    ['Ice cream sandwich', 237, 9.0, 37, 4.3],
    ['Eclair', 262, 16.0, 24, 6.0],
  ],
  selectedRowIndexes: [1],
};

/** @return {!HTMLElement} */
function renderComponent(props) {
  /* eslint-disable indent */
  const templateResult = html`
    <div class="${cssClasses.ROOT}">
      <table class="mdc-data-table__table">
        <thead>
          <tr class="${cssClasses.HEADER_ROW}">
            ${mdcDataTableHeaderCellTemplate({
              content: mdcCheckboxTemplate({
                classNames: cssClasses.HEADER_ROW_CHECKBOX,
              }),
            })}
            ${props.data.headers.map((header) =>
              mdcDataTableHeaderCellTemplate({content: header}),
            )}
          </tr>
        </thead>
        <tbody class="mdc-data-table__content">
          ${props.data.rows.map((row, index) => {
            const isSelected =
              props.data.selectedRowIndexes.indexOf(index) >= 0;
            return mdcDataTableRowTemplate({
              rowId: `u${index}`,
              isSelected: isSelected,
              content: row.map((cell) => {
                const isNumeric = typeof cell === 'number';
                return mdcDataTableCellTemplate({content: cell, isNumeric});
              }),
            });
          })}
        </tbody>
      </table>
    </div>
  `;

  document.body.innerHTML = '';
  const container = document.createElement('div');
  document.body.appendChild(container);
  render(templateResult, container);
  return document.querySelector(`.${cssClasses.ROOT}`);
}

function setupTest() {
  const root = renderComponent({data: mdcDataTableData});
  const component = new MDCDataTable(root);
  const adapter = component.getDefaultFoundation().adapter_;
  return {root, component, adapter};
}

function setupTestWithMocks() {
  const root = renderComponent({data: mdcDataTableData});
  const MockFoundationCtor = td.constructor(MDCDataTableFoundation);
  const mockFoundation = new MockFoundationCtor();
  const mockCheckboxFactory = td.function('checkboxFactory');
  const component = new MDCDataTable(root, mockFoundation, mockCheckboxFactory);
  const adapter = component.getDefaultFoundation().adapter_;
  return {root, component, mockFoundation, mockCheckboxFactory, adapter};
}

suite('MDCDataTable');

test('#attachTo returns a component instance', () => {
  const root = renderComponent({data: mdcDataTableData});
  const component = MDCDataTable.attachTo(root);
  assert.instanceOf(component, MDCDataTable);
  component.destroy();
});

test('#initialSyncWithDOM registers change events on header row & row checkboxes', () => {
  const {root, component, mockFoundation} = setupTestWithMocks();

  root
    .querySelector(strings.HEADER_ROW_CHECKBOX_SELECTOR)
    .querySelector('input')
    .click();
  td.verify(mockFoundation.handleHeaderRowCheckboxChange(), {times: 1});

  root
    .querySelector(strings.ROW_CHECKBOX_SELECTOR)
    .querySelector('input')
    .click();
  td.verify(mockFoundation.handleRowCheckboxChange(td.matchers.isA(Event)), {
    times: 1,
  });

  component.destroy();
});

test('#initialSyncWithDOM calls foundation.layout() method', () => {
  const {component, mockFoundation} = setupTestWithMocks();
  td.verify(mockFoundation.layout(), {times: 1});
  component.destroy();
});

test('#getRows calls foundation.getRows() method', () => {
  const {component, mockFoundation} = setupTestWithMocks();
  component.getRows();
  td.verify(mockFoundation.getRows(), {times: 1});
  component.destroy();
});

test('#getSelectedRowIds calls foundation.getSelectedRowIds() method', () => {
  const {component, mockFoundation} = setupTestWithMocks();
  component.getSelectedRowIds();
  td.verify(mockFoundation.getSelectedRowIds(), {times: 1});
  component.destroy();
});

test('#setSelectedRowIds calls foundation.setSelectedRowIds() method', () => {
  const {component, mockFoundation} = setupTestWithMocks();
  component.setSelectedRowIds(['u1', 'u2']);
  td.verify(mockFoundation.setSelectedRowIds(['u1', 'u2']), {times: 1});
  component.destroy();
});

test('adapter#isHeaderRowCheckboxChecked returns true if header row checkbox is checked', () => {
  const {component, root, adapter} = setupTest();

  const nativeCheckbox = root
    .querySelector(strings.HEADER_ROW_CHECKBOX_SELECTOR)
    .querySelector('input');

  nativeCheckbox.checked = false;
  assert.isFalse(adapter.isHeaderRowCheckboxChecked());

  nativeCheckbox.checked = true;
  assert.isTrue(adapter.isHeaderRowCheckboxChecked());

  component.destroy();
});

test('adapter#addClassAtRowIndex adds class name at given row index ', () => {
  const {component, adapter} = setupTest();

  adapter.addClassAtRowIndex(1, 'test-class-name');
  assert.isTrue(component.getRows()[1].classList.contains('test-class-name'));

  component.destroy();
});

test('adapter#removeClassAtRowIndex removes class name from given row index ', () => {
  const {component, adapter} = setupTest();

  adapter.addClassAtRowIndex(1, 'test-remove-class-name');
  adapter.removeClassAtRowIndex(1, 'test-remove-class-name');
  assert.isFalse(
    component.getRows()[1].classList.contains('test-remove-class-name'),
  );

  component.destroy();
});

test('adapter#getAttributeAtRowIndex', () => {
  const {component, adapter} = setupTest();

  assert.equal(
    adapter.getAttributeAtRowIndex(1, strings.DATA_ROW_ID_ATTR),
    'u1',
  );

  component.destroy();
});

test('adapter#setAttributeAtRowIndex', () => {
  const {component, adapter} = setupTest();

  adapter.setAttributeAtRowIndex(1, 'data-test-set-attr', 'test-val-1');
  assert.equal(
    adapter.getAttributeAtRowIndex(1, 'data-test-set-attr'),
    'test-val-1',
  );

  component.destroy();
});

test('adapter#registerRowCheckboxes Initiates all row checkboxes', () => {
  const {
    mockCheckboxFactory,
    mockFoundation,
    root,
    component,
    adapter,
  } = setupTestWithMocks();

  const rows = [].slice.call(root.querySelectorAll(strings.ROW_SELECTOR));
  td.when(mockFoundation.getRows()).thenReturn(rows);

  adapter.registerRowCheckboxes();

  td.verify(mockCheckboxFactory(td.matchers.isA(Element)), {times: 3});
  component.destroy();
});

test('adapter#registerRowCheckboxes subsequent call destroys previous checkbox instances of all row checkboxes', () => {
  const {
    mockFoundation,
    mockCheckboxFactory,
    component,
    root,
    adapter,
  } = setupTestWithMocks();

  const mockDestroy = td.function('checkbox.destroy');
  const rows = [].slice.call(root.querySelectorAll(strings.ROW_SELECTOR));
  td.when(mockFoundation.getRows()).thenReturn(rows);
  td.when(mockCheckboxFactory(td.matchers.isA(Element))).thenReturn({
    destroy: mockDestroy,
  });
  adapter.registerRowCheckboxes();
  adapter.registerRowCheckboxes();

  td.verify(mockDestroy(), {times: 3});
  component.destroy();
});

test('adapter#getRowElements', () => {
  const {component, adapter} = setupTest();

  assert.equal(adapter.getRowElements().length, 3);
  component.destroy();
});

test('adapter#registerHeaderRowCheckbox Initializes header row checkbox', () => {
  const {component, mockCheckboxFactory, adapter} = setupTestWithMocks();

  adapter.registerHeaderRowCheckbox();
  td.verify(mockCheckboxFactory(td.matchers.isA(Element)), {times: 1});

  component.destroy();
});

test('adapter#registerHeaderRowCheckbox re-initializing header row checkbox destroys previous checkbox', () => {
  const {component, mockCheckboxFactory, adapter} = setupTestWithMocks();

  const mockDestroy = td.function('checkbox.destroy');
  td.when(mockCheckboxFactory(td.matchers.isA(Element))).thenReturn({
    destroy: mockDestroy,
  });
  adapter.registerHeaderRowCheckbox();
  adapter.registerHeaderRowCheckbox();
  td.verify(mockDestroy(), {times: 1});

  component.destroy();
});

test('adapter#isRowsSelectable', () => {
  const {component, adapter} = setupTest();

  assert.isTrue(adapter.isRowsSelectable());

  component.destroy();
});

test('adapter#getRowIndexByChildElement', () => {
  const {component, root, adapter} = setupTest();

  const rows = [].slice.call(root.querySelectorAll(strings.ROW_SELECTOR));
  const inputEl = rows[2].querySelector('input');
  assert.equal(adapter.getRowIndexByChildElement(inputEl), 2);

  component.destroy();
});

test('adapter#getRowCount calls foundation.getRows() method', () => {
  const {component, adapter} = setupTest();

  assert.equal(adapter.getRowCount(), 3);

  component.destroy();
});

test('adapter#getSelectedRowCount', () => {
  const {component, adapter} = setupTest();

  assert.equal(
    adapter.getSelectedRowCount(),
    mdcDataTableData.selectedRowIndexes.length,
  );

  component.destroy();
});

test('adapter#notifyRowSelectionChanged', () => {
  const {component, adapter} = setupTest();
  const handler = td.func('notifyRowSelectionChangedHandler');

  component.listen(events.ROW_SELECTION_CHANGED, handler);
  adapter.notifyRowSelectionChanged({rowIndex: 1, rowId: 'u1', selected: true});
  td.verify(handler(td.matchers.anything()));

  component.unlisten(events.ROW_SELECTION_CHANGED, handler);
  component.destroy();
});

test('adapter#setHeaderRowCheckboxIndeterminate', () => {
  const {component, root, adapter} = setupTest();

  const nativeCheckbox = root
    .querySelector(strings.HEADER_ROW_CHECKBOX_SELECTOR)
    .querySelector('input');

  nativeCheckbox.indeterminate = false;
  adapter.setHeaderRowCheckboxIndeterminate(true);
  assert.isTrue(nativeCheckbox.indeterminate);

  component.destroy();
});

test('adapter#setHeaderRowCheckboxChecked', () => {
  const {component, root, adapter} = setupTest();

  const nativeCheckbox = root
    .querySelector(strings.HEADER_ROW_CHECKBOX_SELECTOR)
    .querySelector('input');
  assert.isFalse(nativeCheckbox.checked);
  adapter.setHeaderRowCheckboxChecked(true);
  assert.isTrue(nativeCheckbox.checked);

  component.destroy();
});

test('adapter#getRowIdAtIndex', () => {
  const {component, adapter} = setupTest();

  assert.equal(adapter.getRowIdAtIndex(1), 'u1');
  component.destroy();
});

test('adapter#setRowCheckboxCheckedAtIndex', () => {
  const {component, root, adapter} = setupTest();
  const nativeCheckbox = [].slice
    .call(root.querySelectorAll(strings.ROW_CHECKBOX_SELECTOR))[0]
    .querySelector('input');

  assert.isFalse(nativeCheckbox.checked);
  adapter.setRowCheckboxCheckedAtIndex(0, true);
  assert.isTrue(nativeCheckbox.checked);

  component.destroy();
});

test('adapter#notifySelectedAll', () => {
  const {component, adapter} = setupTest();
  const handler = td.func('notifySelectedAll');

  component.listen(events.SELECTED_ALL, handler);
  adapter.notifySelectedAll();
  td.verify(handler(td.matchers.anything()));

  component.unlisten(events.SELECTED_ALL, handler);
  component.destroy();
});

test('adapter#notifyUnselectedAll', () => {
  const {component, adapter} = setupTest();
  const handler = td.func('notifyUnselectedAll');

  component.listen(events.UNSELECTED_ALL, handler);
  adapter.notifyUnselectedAll();
  td.verify(handler(td.matchers.anything()));

  component.unlisten(events.UNSELECTED_ALL, handler);
  component.destroy();
});