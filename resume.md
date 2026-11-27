---
layout: base.njk
title: Resume
pageStyles:
  - /css/resume.css
templateEngineOverride: njk
---
<div class="resume-page">
    <header class="page-header">
        <h1>Resume.</h1>
        <p class="lede">Compilers, computer architecture, and a soft spot for RISC-V. The short version is below; the PDF is the printable one.</p>
        {% if resumePdfAvailable %}
        <p class="page-actions">
            <a href="/resume/Zain Siddavatam Resume.pdf" download>Download PDF</a>
        </p>
        {% endif %}
    </header>

    {% if resumeAvailable %}
        {% include "resume_content.njk" %}
    {% else %}
        <div class="notice">
            <p><strong>The resume is compiled from LaTeX during deployment.</strong></p>
            <p>Run <code>cd resume &amp;&amp; ./compile.sh</code> locally{% if resumePdfAvailable %}, or download the <a href="/resume/Zain Siddavatam Resume.pdf">PDF version</a>{% endif %}.</p>
        </div>
    {% endif %}
</div>
