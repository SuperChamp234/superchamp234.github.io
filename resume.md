---
layout: base.njk
title: Resume
pageStyles:
  - /css/resume.css
templateEngineOverride: njk
---
<div class="resume-page">
    <header class="page-header">
        <p class="eyebrow">Curriculum vitae</p>
        <h1>Resume.</h1>
        <p class="lede">Hardware verification, computer architecture, and a soft spot for RISC-V. The short version is below; the PDF is the printable one.</p>
        <p class="page-actions">
            {% if resumePdfAvailable %}
            <a href="/resume/Zain Siddavatam Resume.pdf" download>Download PDF</a> ·
            {% endif %}
            <a href="mailto:{{ site.email }}">Email me</a>
        </p>
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
