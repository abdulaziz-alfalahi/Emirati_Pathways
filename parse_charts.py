import openpyxl

wb = openpyxl.load_workbook('./backend/master_file.xlsx', data_only=True)
for sheet_name in wb.sheetnames:
    ws = wb[sheet_name]
    if ws._charts:
        print(f"Sheet: {sheet_name}")
        for i, chart in enumerate(ws._charts):
            title = chart.title.tx.rich.p[0].r[0].t if chart.title and chart.title.tx and chart.title.tx.rich else getattr(chart.title, "text", "No Title")
            chart_type = type(chart).__name__
            print(f"  - Chart {i+1} ({chart_type}): {title}")
