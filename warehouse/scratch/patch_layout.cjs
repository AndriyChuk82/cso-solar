const fs = require('fs');

function patchFile(filepath, targets) {
  let content = fs.readFileSync(filepath, 'utf8').replace(/\r\n/g, '\n');
  targets.forEach((t, i) => {
    if (content.indexOf(t.search) === -1) {
      console.error(`Error: Could not find search string ${i} in ${filepath}:`, t.search);
      process.exit(1);
    }
    content = content.replace(t.search, t.replace);
  });
  fs.writeFileSync(filepath, content, 'utf8');
  console.log(`SUCCESS: ${filepath} successfully patched!`);
}

// 1. Patch BuyerIssueForm.jsx
patchFile('warehouse/src/pages/BuyerIssueForm.jsx', [
  {
    search: `                          {/* Залишок товару в рядку */}
                          {item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className={isOver ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                                {stock} {item.unit}
                              </span>
                              {isOver && (
                                <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded ml-1">
                                  ⚠️ Недостатньо
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>`,
    replace: `                          {/* Залишок товару в рядку */}
                          {item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className="text-green-600 font-semibold">
                                {stock} {item.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>`
  },
  {
    search: `                      {/* Кількість */}
                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[100px]">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-20 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-8 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                      </td>`,
    replace: `                      {/* Кількість */}
                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[100px]">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-20 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-8 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                        {isOver && (
                          <div className="text-[10px] text-red-500 font-semibold mt-1">
                            ⚠️ Недостатньо
                          </div>
                        )}
                      </td>`
  }
]);

// 2. Patch OperationForm.jsx
patchFile('warehouse/src/pages/OperationForm.jsx', [
  {
    search: `                          {/* Залишок товару в рядку (тільки для розходу) */}
                          {!isIncome && item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className={isOver ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                                {stock} {item.unit}
                              </span>
                              {isOver && (
                                <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded ml-1">
                                  ⚠️ Недостатньо
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>`,
    replace: `                          {/* Залишок товару в рядку (тільки для розходу) */}
                          {!isIncome && item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className="text-green-600 font-semibold">
                                {stock} {item.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>`
  },
  {
    search: `                      {/* Кількість */}
                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-24 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-10 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                      </td>`,
    replace: `                      {/* Кількість */}
                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <input
                            type="number"
                            step="any"
                            min="0.001"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-24 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-10 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                        {isOver && (
                          <div className="text-[10px] text-red-500 font-semibold mt-1">
                            ⚠️ Недостатньо
                          </div>
                        )}
                      </td>`
  },
  {
    search: `                      /* Для Розходу: Кількість та Доступно поруч */
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-secondary)] shrink-0">Кількість:</span>
                          <div className="flex items-center gap-1.5 min-w-0">
                            <input
                              type="number"
                              step="any"
                              min="0.001"
                              required={!!item.productId}
                              disabled={!item.productId}
                              className="w-16 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] focus:outline-none disabled:opacity-40 text-center font-semibold"
                              value={item.quantity}
                              onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                              onFocus={(e) => e.target.select()}
                            />
                            {item.unit && <span className="text-xs text-[var(--text-secondary)] font-medium truncate" title={item.unit}>{item.unit}</span>}
                          </div>
                        </div>

                        {item.productId && (
                          <div className="flex items-center gap-1 text-[11px] justify-end">
                            <span className="text-[var(--text-secondary)] font-medium">Доступно:</span>
                            <span className={isOver ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                              {stock} {item.unit}
                            </span>
                            {isOver && (
                              <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded">
                                ⚠️ Недостатньо
                              </span>
                            )}
                          </div>
                        )}
                      </div>`,
    replace: `                      /* Для Розходу: Кількість та Доступно поруч */
                      <div className="grid grid-cols-2 gap-2 items-center">
                        <div className="flex items-center gap-2">
                          <span className="font-semibold text-[var(--text-secondary)] shrink-0">Кількість:</span>
                          <div className="flex flex-col items-start gap-0.5 min-w-0">
                            <div className="flex items-center gap-1.5">
                              <input
                                type="number"
                                step="any"
                                min="0.001"
                                required={!!item.productId}
                                disabled={!item.productId}
                                className="w-16 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] focus:outline-none disabled:opacity-40 text-center font-semibold"
                                value={item.quantity}
                                onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                                onFocus={(e) => e.target.select()}
                              />
                              {item.unit && <span className="text-xs text-[var(--text-secondary)] font-medium truncate" title={item.unit}>{item.unit}</span>}
                            </div>
                            {isOver && (
                              <span className="text-[9px] text-red-500 font-bold mt-0.5">
                                ⚠️ Недостатньо
                              </span>
                            )}
                          </div>
                        </div>

                        {item.productId && (
                          <div className="flex items-center gap-1 text-[11px] justify-end">
                            <span className="text-[var(--text-secondary)] font-medium">Доступно:</span>
                            <span className="text-green-600 font-semibold">
                              {stock} {item.unit}
                            </span>
                          </div>
                        )}
                      </div>`
  }
]);

// 3. Patch Transfer.jsx
patchFile('warehouse/src/pages/Transfer.jsx', [
  {
    search: `                          {/* Залишок товару в рядку */}
                          {item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className={isOver ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                                {stock} {item.unit}
                              </span>
                              {isOver && (
                                <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded ml-1">
                                  ⚠️ Недостатньо
                                </span>
                              )}
                            </div>
                          )}
                        </div>
                      </td>`,
    replace: `                          {/* Залишок товару в рядку */}
                          {item.productId && (
                            <div className="flex items-center justify-center gap-1.5 text-[11px] whitespace-nowrap bg-[var(--border-light)] px-2 py-1 rounded w-32 shrink-0">
                              <span className="text-[var(--text-secondary)] font-medium">Залишок:</span>
                              <span className="text-green-600 font-semibold">
                                {stock} {item.unit}
                              </span>
                            </div>
                          )}
                        </div>
                      </td>`
  },
  {
    search: `                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-24 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-10 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                      </td>`,
    replace: `                      <td className="p-2">
                        <div className="flex items-center gap-1 min-w-[120px]">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-24 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] sm:text-xs focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-[10px] text-[var(--text-secondary)] w-10 text-left truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                        {isOver && (
                          <div className="text-[10px] text-red-500 font-semibold mt-1">
                            ⚠️ Недостатньо
                          </div>
                        )}
                      </td>`
  },
  {
    search: `                  <div className="pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-secondary)] shrink-0">Кількість:</span>
                        <div className="flex items-center gap-1.5 min-w-0">
                          <input
                            type="number"
                            min="1"
                            step="1"
                            required={!!item.productId}
                            disabled={!item.productId}
                            className="w-16 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] focus:outline-none disabled:opacity-40 text-center font-semibold"
                            value={item.quantity}
                            onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                            onFocus={(e) => e.target.select()}
                          />
                          {item.unit && <span className="text-xs text-[var(--text-secondary)] font-medium truncate" title={item.unit}>{item.unit}</span>}
                        </div>
                      </div>

                      {item.productId && (
                        <div className="flex items-center gap-1 text-[11px] justify-end">
                          <span className="text-[var(--text-secondary)] font-medium">Доступно:</span>
                          <span className={isOver ? 'text-red-500 font-bold' : 'text-green-600 font-semibold'}>
                            {stock} {item.unit}
                          </span>
                          {isOver && (
                            <span className="text-[9px] text-amber-500 font-bold bg-amber-500/10 px-1 rounded">
                              ⚠️ Недостатньо
                            </span>
                          )}
                        </div>
                      )}
                    </div>
                  </div>`,
    replace: `                  <div className="pt-1 text-xs">
                    <div className="grid grid-cols-2 gap-2 items-center">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-[var(--text-secondary)] shrink-0">Кількість:</span>
                        <div className="flex flex-col items-start gap-0.5 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <input
                              type="number"
                              min="1"
                              step="1"
                              required={!!item.productId}
                              disabled={!item.productId}
                              className="w-16 p-1 rounded border border-[var(--border)] bg-[var(--bg)] text-[var(--text)] text-[16px] focus:outline-none disabled:opacity-40 text-center font-semibold"
                              value={item.quantity}
                              onChange={(e) => updateRowField(index, 'quantity', e.target.value)}
                              onFocus={(e) => e.target.select()}
                            />
                            {item.unit && <span className="text-xs text-[var(--text-secondary)] font-medium truncate" title={item.unit}>{item.unit}</span>}
                          </div>
                          {isOver && (
                            <span className="text-[9px] text-red-500 font-bold mt-0.5">
                              ⚠️ Недостатньо
                            </span>
                          )}
                        </div>
                      </div>

                      {item.productId && (
                        <div className="flex items-center gap-1 text-[11px] justify-end">
                          <span className="text-[var(--text-secondary)] font-medium">Доступно:</span>
                          <span className="text-green-600 font-semibold">
                            {stock} {item.unit}
                          </span>
                        </div>
                      )}
                    </div>
                  </div>`
  }
]);
